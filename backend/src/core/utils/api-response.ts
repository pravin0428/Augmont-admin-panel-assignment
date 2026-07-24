import type { Response } from 'express';
import { HttpStatus } from '@core/errors/http-status';
import type { FieldError } from '@core/errors/app-error';

/**
 * A single, consistent response envelope for the entire API.
 *
 * WHY: clients (our Angular app, Postman, future integrators) should parse ONE
 * predictable shape for both success and failure. `success` is the branch flag;
 * `data` is present on success, `errors` on failure. This is the contract the
 * frontend's error interceptor relies on.
 */
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors: FieldError[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Send a success envelope with the given payload and status. */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode: HttpStatus = HttpStatus.OK,
): Response {
  const body: ApiSuccess<T> = { success: true, message, data };
  return res.status(statusCode).json(body);
}

/** Send a failure envelope. Used by the central error handler. */
export function sendFailure(
  res: Response,
  message: string,
  statusCode: HttpStatus,
  errors: FieldError[] = [],
): Response {
  const body: ApiFailure = { success: false, message, errors };
  return res.status(statusCode).json(body);
}
