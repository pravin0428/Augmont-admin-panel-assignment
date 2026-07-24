import type { Request, Response } from 'express';
import { BadRequestError } from '@core/errors/app-error';
import { sendSuccess } from '@core/utils/api-response';
import { logger } from '@core/utils/logger';
import { importProductsFromFile } from './bulk-import.service';

/**
 * Bulk import controller.
 *
 * The request stays open for the duration but does NOT time out because the work
 * is chunked into short batch inserts (see the service). We stream-process and
 * then return a summary. For truly massive/enterprise loads this same service
 * would be moved behind a job queue and the endpoint would return 202 + a job id;
 * the streaming design makes that migration trivial (same processing function).
 */
export const bulkImportController = {
  async import(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      throw new BadRequestError('No file uploaded. Send a CSV or XLSX file in the "file" field');
    }

    const startedAt = Date.now();
    logger.info(`Bulk import started: ${req.file.originalname} (${req.file.size} bytes)`);

    const summary = await importProductsFromFile(req.file.path, startedAt, () => Date.now());

    logger.info(
      `Bulk import finished: ${summary.inserted}/${summary.totalRecords} inserted, ` +
        `${summary.failed} failed in ${summary.durationMs}ms`,
    );

    sendSuccess(res, summary, 'Bulk import completed');
  },
};
