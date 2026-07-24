import type { NextFunction, Request, Response } from 'express';
import { tokenService } from '@core/utils/jwt';
import { UnauthorizedError } from '@core/errors/app-error';

/**
 * Auth guard: verifies the `Authorization: Bearer <token>` header and attaches
 * the decoded user to `req.user`. Any protected route mounts this first.
 *
 * WHY a middleware (not per-controller checks): auth is a cross-cutting concern.
 * Centralising it means every protected route is guarded identically and we
 * cannot forget a check in one handler. Downstream controllers can trust that
 * `req.user` exists.
 *
 * Verification failures are converted to a 401 via our error pipeline. We do NOT
 * hit the database here — the signed token is sufficient proof of identity
 * (stateless auth), which keeps the guard fast.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new UnauthorizedError('Authentication token was not provided');
  }

  // Throws JsonWebTokenError/TokenExpiredError → mapped to 401 centrally.
  const payload = tokenService.verify(token);

  req.user = { id: payload.sub, email: payload.email };
  next();
}
