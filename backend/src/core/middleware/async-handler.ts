import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async route handler so any rejected promise is forwarded to
 * Express' error pipeline via `next(err)`.
 *
 * WHY: Express 4 does NOT catch rejected promises from async handlers — an
 * unhandled rejection would hang the request and crash the process. Rather than
 * scatter try/catch in every controller, we wrap once here (DRY). Controllers
 * stay clean and just `throw` domain errors.
 */
export function asyncHandler<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, unknown>,
>(
  handler: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
