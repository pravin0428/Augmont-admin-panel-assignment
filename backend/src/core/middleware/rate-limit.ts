import rateLimit from 'express-rate-limit';
import { config } from '@config/env';
import { HttpStatus } from '@core/errors/http-status';
import type { ApiFailure } from '@core/utils/api-response';

/**
 * Rate limiting (bonus feature) — protects against brute force and abuse.
 * WHY two limiters: auth endpoints are the prime brute-force target, so they
 * get a tighter budget than the general API.
 */

const failureBody = (message: string): ApiFailure => ({
  success: false,
  message,
  errors: [],
});

/** Global limiter applied to the whole API. */
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HttpStatus.TOO_MANY_REQUESTS,
  message: failureBody('Too many requests, please try again later'),
});

/** Stricter limiter for auth (login/register) to slow credential stuffing. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HttpStatus.TOO_MANY_REQUESTS,
  message: failureBody('Too many authentication attempts, please try again later'),
});
