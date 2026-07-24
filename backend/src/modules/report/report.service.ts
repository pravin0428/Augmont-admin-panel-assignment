import type { Response } from 'express';
import { once } from 'node:events';
import ExcelJS from 'exceljs';
import { prisma } from '@core/db/prisma';
import { buildProductWhere, type ProductFilter } from '@modules/product/product.query';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Product report export — STREAMING (never build a huge array/file in memory).
 *
 * WHY it never times out or OOMs:
 *   • We pull rows from Postgres in bounded KEYSET pages (WHERE id > lastId
 *     ORDER BY id LIMIT N), not one giant SELECT. Keyset (not OFFSET) stays fast
 *     even deep into a large table.
 *   • We WRITE each page straight to the HTTP response stream and release it.
 *     Peak memory ≈ one page, whether the export is 100 rows or 10 million.
 *   • We respect backpressure: if the socket buffer is full (`res.write` returns
 *     false) we wait for 'drain' before fetching more. This paces the DB reads to
 *     the client's download speed and keeps memory flat.
 *   • Because bytes flow continuously, the connection is never idle, so no idle
 *     timeout fires — the classic cause of 504s on big downloads.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PAGE_SIZE = 1000;

interface ReportRow {
  id: number;
  uniqueId: string;
  name: string;
  price: number;
  category: string;
  createdAt: Date;
}

const HEADERS = ['Unique ID', 'Name', 'Price', 'Category', 'Created At'] as const;

/**
 * Async generator that yields product rows page by page using keyset pagination.
 * Only one page is resident at a time.
 */
async function* iterateProducts(filter: ProductFilter): AsyncGenerator<ReportRow> {
  const where = buildProductWhere(filter);
  let cursorId = 0;

  for (;;) {
    const rows = await prisma.product.findMany({
      where: { ...where, id: { gt: cursorId } },
      orderBy: { id: 'asc' },
      take: PAGE_SIZE,
      select: {
        id: true,
        uniqueId: true,
        name: true,
        price: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    });

    if (rows.length === 0) break;

    for (const row of rows) {
      yield {
        id: row.id,
        uniqueId: row.uniqueId,
        name: row.name,
        price: row.price.toNumber(),
        category: row.category.name,
        createdAt: row.createdAt,
      };
    }

    if (rows.length < PAGE_SIZE) break; // last page
    cursorId = rows[rows.length - 1]!.id;
  }
}

/** RFC-4180 CSV cell escaping: quote when the value contains ," or newlines. */
function csvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Write a chunk to the response, awaiting 'drain' if the buffer is full (backpressure). */
async function writeWithBackpressure(res: Response, chunk: string): Promise<void> {
  if (!res.write(chunk)) {
    await once(res, 'drain');
  }
}

/** Stream a CSV report directly to the response. */
export async function streamProductsCsv(res: Response, filter: ProductFilter): Promise<void> {
  // Header row.
  await writeWithBackpressure(res, `${HEADERS.map(csvCell).join(',')}\n`);

  for await (const row of iterateProducts(filter)) {
    const line = [
      row.uniqueId,
      row.name,
      row.price,
      row.category,
      row.createdAt.toISOString(),
    ]
      .map(csvCell)
      .join(',');
    await writeWithBackpressure(res, `${line}\n`);
  }

  res.end();
}

/**
 * Stream an XLSX report using ExcelJS's streaming workbook writer, which flushes
 * rows to the output stream incrementally instead of holding the whole workbook.
 */
export async function streamProductsXlsx(res: Response, filter: ProductFilter): Promise<void> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res, useStyles: false });
  const sheet = workbook.addWorksheet('Products');

  // committing the header row writes it out immediately.
  sheet.addRow([...HEADERS]).commit();

  for await (const row of iterateProducts(filter)) {
    sheet
      .addRow([row.uniqueId, row.name, row.price, row.category, row.createdAt.toISOString()])
      .commit();
  }

  await sheet.commit();
  await workbook.commit(); // finalises and ends the response stream
}
