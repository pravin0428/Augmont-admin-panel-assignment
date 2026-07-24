import { HttpStatus } from './http-status';

/** Shape of a single field-level error returned to the client. */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Base class for all *expected* (operational) errors — bad input, missing
 * resource, auth failure, conflicts. These are part of normal operation.
 *
 * WHY a dedicated base class:
 *   - The central error handler can distinguish EXPECTED errors (which carry a
 *     safe status + message we can show the client) from UNEXPECTED bugs
 *     (which must be logged and returned as a generic 500 — never leak stack).
 *   - `isOperational` is the flag we branch on. Any error that is NOT an
 *     AppError is treated as a programmer error / crash.
 */
export class AppError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly isOperational: boolean;
  public readonly errors: FieldError[];

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    errors: FieldError[] = [],
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    // Restore prototype chain (needed when extending built-ins in TS).
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 — malformed request / failed validation. */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors: FieldError[] = []) {
    super(message, HttpStatus.BAD_REQUEST, errors);
  }
}

/** 401 — missing or invalid authentication. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

/** 403 — authenticated but not allowed. */
export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

/** 404 — resource does not exist. */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

/** 409 — conflict with current state (e.g. duplicate unique field). */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, HttpStatus.CONFLICT);
  }
}
