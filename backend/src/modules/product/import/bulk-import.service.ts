import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import csvParser from 'csv-parser';
import ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';
import { prisma } from '@core/db/prisma';
import { config } from '@config/env';
import { logger } from '@core/utils/logger';
import { BadRequestError } from '@core/errors/app-error';
import type { ImportFailure, ImportSummary, RawRow } from './bulk-import.types';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Bulk product import — STREAMING, BATCHED, FAULT-TOLERANT.
 *
 * WHY STREAMING AVOIDS TIMEOUTS (the core requirement):
 *   A naive import reads the whole file into memory, builds one giant array,
 *   then does one massive insert. For a large file this:
 *     (a) can exhaust heap memory (OOM), and
 *     (b) keeps the event loop busy / the single DB statement running so long
 *         that the load balancer / client kills the connection with a 504.
 *
 *   Streaming fixes both:
 *     • We read the file ROW BY ROW as a stream — memory stays flat no matter
 *       how big the file is (we never hold more than one batch at a time).
 *     • We insert in small BATCHES. Each batch is a short, bounded DB operation,
 *       so no single query runs long enough to trip a timeout. The request stays
 *       responsive and finishes predictably.
 *     • `for await ... of stream` applies BACKPRESSURE automatically: while we
 *       await a batch insert, the file stream pauses, so we never out-run the DB.
 *
 * FAULT TOLERANCE ("continue even if a few rows fail"):
 *   Rows are validated in-app first. A batch is inserted with createMany (fast);
 *   if that batch throws (e.g. a DB constraint we couldn't foresee), we retry the
 *   batch ROW BY ROW to isolate and report only the offending rows, keeping the
 *   good ones.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BATCH_SIZE = config.upload.bulkImportBatchSize;
const MAX_FAILURES_STORED = 1000; // bound response size for pathological files

/** A validated, insert-ready product row plus its source line for error reports. */
interface PreparedRow {
  rowNumber: number;
  data: { name: string; price: number; categoryId: number };
}

/** Lookup structures so we resolve categories WITHOUT a DB hit per row. */
interface CategoryIndex {
  byName: Map<string, number>;
  ids: Set<number>;
}

async function loadCategoryIndex(): Promise<CategoryIndex> {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });
  const byName = new Map<string, number>();
  const ids = new Set<number>();
  for (const c of categories) {
    byName.set(c.name.trim().toLowerCase(), c.id);
    ids.add(c.id);
  }
  return { byName, ids };
}

/** Normalise a raw record's keys to trimmed lowercase for tolerant column matching. */
function normaliseKeys(raw: RawRow): RawRow {
  const out: RawRow = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key.trim().toLowerCase()] = typeof value === 'string' ? value.trim() : value;
  }
  return out;
}

/**
 * Validate one row and resolve its category. Returns a PreparedRow on success or
 * a failure reason string on error. Pure/synchronous — all IO was pre-loaded.
 */
function validateRow(
  raw: RawRow,
  rowNumber: number,
  categories: CategoryIndex,
): { prepared: PreparedRow } | { reason: string } {
  const record = normaliseKeys(raw);

  const name = record.name;
  if (!name) return { reason: 'Missing required field "name"' };
  if (name.length > 150) return { reason: 'name exceeds 150 characters' };

  const priceRaw = record.price;
  const price = Number(priceRaw);
  if (priceRaw === undefined || priceRaw === '' || !Number.isFinite(price)) {
    return { reason: `Invalid price "${priceRaw ?? ''}"` };
  }
  if (price <= 0) return { reason: 'price must be greater than 0' };

  // Resolve category by explicit id, else by name.
  let categoryId: number | undefined;
  if (record.categoryid) {
    const parsed = Number(record.categoryid);
    if (Number.isInteger(parsed) && categories.ids.has(parsed)) {
      categoryId = parsed;
    } else {
      return { reason: `Unknown categoryId "${record.categoryid}"` };
    }
  } else if (record.category) {
    categoryId = categories.byName.get(record.category.toLowerCase());
    if (categoryId === undefined) {
      return { reason: `Unknown category "${record.category}"` };
    }
  } else {
    return { reason: 'Missing category (provide "category" name or "categoryId")' };
  }

  return { prepared: { rowNumber, data: { name, price, categoryId } } };
}

/** Insert a batch fast; on failure, fall back to per-row inserts to isolate errors. */
async function insertBatch(
  batch: PreparedRow[],
): Promise<{ inserted: number; failures: ImportFailure[] }> {
  if (batch.length === 0) return { inserted: 0, failures: [] };

  try {
    const result = await prisma.product.createMany({
      data: batch.map((r) => ({
        name: r.data.name,
        price: new Prisma.Decimal(r.data.price),
        categoryId: r.data.categoryId,
      })),
    });
    return { inserted: result.count, failures: [] };
  } catch {
    // A row in this batch violated a constraint — isolate row by row.
    let inserted = 0;
    const failures: ImportFailure[] = [];
    for (const row of batch) {
      try {
        await prisma.product.create({
          data: {
            name: row.data.name,
            price: new Prisma.Decimal(row.data.price),
            categoryId: row.data.categoryId,
          },
        });
        inserted += 1;
      } catch (err) {
        failures.push({
          row: row.rowNumber,
          reason: err instanceof Error ? err.message : 'Database insert failed',
        });
      }
    }
    return { inserted, failures };
  }
}

/** Async-iterable of raw rows from a CSV file (streamed, header-mapped). */
function csvRowStream(filePath: string): AsyncIterable<RawRow> {
  return fs
    .createReadStream(filePath)
    .pipe(csvParser({ mapHeaders: ({ header }) => header.trim().toLowerCase() }));
}

/** Async generator of raw rows from an XLSX file using ExcelJS's streaming reader. */
async function* xlsxRowStream(filePath: string): AsyncGenerator<RawRow> {
  const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {});
  let headers: string[] = [];

  for await (const worksheet of workbookReader) {
    for await (const row of worksheet) {
      // row.values is a 1-based sparse array: [ <empty>, col1, col2, ... ]
      const values = row.values as Array<unknown>;
      if (row.number === 1) {
        headers = values.map((v) => String(v ?? '').trim().toLowerCase());
        continue;
      }
      const record: RawRow = {};
      for (let col = 1; col < values.length; col += 1) {
        const key = headers[col];
        if (!key) continue;
        const cell = values[col];
        record[key] = cell === null || cell === undefined ? '' : String(cell);
      }
      yield record;
    }
    // Only process the first worksheet.
    break;
  }
}

/** Pick the correct streaming parser from the file extension. */
function rowStreamFor(filePath: string): AsyncIterable<RawRow> {
  if (filePath.toLowerCase().endsWith('.csv')) return csvRowStream(filePath);
  if (filePath.toLowerCase().endsWith('.xlsx')) return xlsxRowStream(filePath);
  throw new BadRequestError('Unsupported file type for import');
}

/**
 * Orchestrates the whole streamed import and returns a summary.
 * `startedAtMs` is passed in because Date.now() is injected by the caller
 * (keeps this function deterministic/testable).
 */
export async function importProductsFromFile(
  filePath: string,
  startedAtMs: number,
  nowMs: () => number,
): Promise<ImportSummary> {
  const categories = await loadCategoryIndex();

  let total = 0;
  let inserted = 0;
  let failedCount = 0;
  const failures: ImportFailure[] = [];
  let batch: PreparedRow[] = [];

  const recordFailure = (row: number, reason: string): void => {
    failedCount += 1;
    if (failures.length < MAX_FAILURES_STORED) failures.push({ row, reason });
  };

  const flush = async (): Promise<void> => {
    const result = await insertBatch(batch);
    inserted += result.inserted;
    for (const f of result.failures) recordFailure(f.row, f.reason);
    batch = [];
  };

  try {
    for await (const raw of rowStreamFor(filePath)) {
      total += 1;
      const rowNumber = total; // 1-based data row (header excluded by parsers)

      const outcome = validateRow(raw, rowNumber, categories);
      if ('reason' in outcome) {
        recordFailure(rowNumber, outcome.reason);
        continue;
      }

      batch.push(outcome.prepared);
      if (batch.length >= BATCH_SIZE) {
        // Awaiting here pauses the file stream — natural backpressure.
        await flush();
      }
    }
    await flush(); // insert the trailing partial batch
  } finally {
    // Always clean up the uploaded temp file, even on error.
    await fsp.unlink(filePath).catch((err) => logger.warn('Failed to remove import file', { err }));
  }

  return {
    totalRecords: total,
    inserted,
    failed: failedCount,
    failures,
    failuresTruncated: failedCount > failures.length,
    durationMs: nowMs() - startedAtMs,
  };
}
