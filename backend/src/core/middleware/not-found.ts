import type { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '@core/errors/app-error';

/**
 * Catch-all for unmatched routes. Registered AFTER all real routes so any URL
 * that falls through becomes a clean 404 handled by the central error handler,
 * instead of Express' default HTML "Cannot GET /x" page.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
}
