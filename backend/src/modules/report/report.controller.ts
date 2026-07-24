import type { Request, Response } from 'express';
import { logger } from '@core/utils/logger';
import type { ProductFilter } from '@modules/product/product.query';
import { streamProductsCsv, streamProductsXlsx } from './report.service';

/** Extract the shared product filter from the (validated) query string. */
function filterFromQuery(req: Request): ProductFilter {
  const q = req.query as Record<string, unknown>;
  return {
    ...(q.search ? { search: q.search as string } : {}),
    ...(q.categoryId !== undefined ? { categoryId: q.categoryId as number } : {}),
    ...(q.minPrice !== undefined ? { minPrice: q.minPrice as number } : {}),
    ...(q.maxPrice !== undefined ? { maxPrice: q.maxPrice as number } : {}),
  };
}

export const reportController = {
  async download(req: Request, res: Response): Promise<void> {
    const format = (req.query.format as string) === 'xlsx' ? 'xlsx' : 'csv';
    const filter = filterFromQuery(req);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `products-report-${stamp}.${format}`;

    // Set streaming/attachment headers BEFORE writing any bytes.
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader(
      'Content-Type',
      format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv; charset=utf-8',
    );

    try {
      if (format === 'xlsx') {
        await streamProductsXlsx(res, filter);
      } else {
        await streamProductsCsv(res, filter);
      }
    } catch (err) {
      // Headers are already sent, so we cannot emit a JSON error envelope. Log it
      // and abort the connection so the client sees a truncated/failed download.
      logger.error('Report streaming failed mid-flight', { error: err });
      if (!res.destroyed) res.destroy(err as Error);
    }
  },
};
