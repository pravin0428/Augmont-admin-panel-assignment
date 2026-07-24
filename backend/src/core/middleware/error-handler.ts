import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError, type FieldError } from '@core/errors/app-error';
import { HttpStatus } from '@core/errors/http-status';
import { sendFailure } from '@core/utils/api-response';
import { config } from '@config/env';
import { logger } from '@core/utils/logger';

/** Normalised result of translating any thrown value into an HTTP response. */
interface TranslatedError {
  statusCode: HttpStatus;
  message: string;
  errors: FieldError[];
  /** Unexpected (non-operational) errors are logged at `error` level with stack. */
  isUnexpected: boolean;
}

/** Map Prisma's coded errors to meaningful HTTP responses. */
function translatePrismaError(
  err: Prisma.PrismaClientKnownRequestError,
): TranslatedError | null {
  switch (err.code) {
    case 'P2002': {
      // Unique constraint violation. `meta.target` lists the offending field(s).
      const target = err.meta?.target;
      const fields = Array.isArray(target) ? target.join(', ') : String(target ?? 'field');
      return {
        statusCode: HttpStatus.CONFLICT,
        message: `A record with this ${fields} already exists`,
        errors: [{ field: fields, message: 'Must be unique' }],
        isUnexpected: false,
      };
    }
    case 'P2025':
      // Record required by an operation was not found (update/delete).
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'The requested record was not found',
        errors: [],
        isUnexpected: false,
      };
    case 'P2003':
      // Foreign key constraint failed (e.g. categoryId points nowhere).
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Related record does not exist (foreign key constraint failed)',
        errors: [],
        isUnexpected: false,
      };
    default:
      return null;
  }
}

/** Translate any thrown value into a safe HTTP response descriptor. */
function translate(err: unknown): TranslatedError {
  // 1. Our own operational errors — trusted status + message.
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      isUnexpected: !err.isOperational,
    };
  }

  // 2. Prisma known request errors.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const translated = translatePrismaError(err);
    if (translated) return translated;
  }

  // 3. Prisma validation errors (bad args reaching the query engine).
  if (err instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Invalid data supplied to the database query',
      errors: [],
      isUnexpected: false,
    };
  }

  // 4. Multer upload errors (size/type/field). LIMIT_FILE_SIZE is the common one.
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file exceeds the maximum allowed size' : err.message;
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      errors: [{ field: err.field ?? 'file', message }],
      isUnexpected: false,
    };
  }

  // 5. JWT errors reaching the handler (defence in depth; auth middleware maps most).
  if (err instanceof TokenExpiredError) {
    return { statusCode: HttpStatus.UNAUTHORIZED, message: 'Token has expired', errors: [], isUnexpected: false };
  }
  if (err instanceof JsonWebTokenError) {
    return { statusCode: HttpStatus.UNAUTHORIZED, message: 'Invalid token', errors: [], isUnexpected: false };
  }

  // 6. Malformed JSON body (thrown by express.json()).
  if (err instanceof SyntaxError && 'body' in err) {
    return { statusCode: HttpStatus.BAD_REQUEST, message: 'Malformed JSON in request body', errors: [], isUnexpected: false };
  }

  // 7. Anything else is an unexpected programmer error — never leak details.
  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred',
    errors: [],
    isUnexpected: true,
  };
}

/**
 * Central Express error-handling middleware (4-arg signature is required by
 * Express to recognise it as an error handler). Registered LAST.
 *
 * WHY centralise: one place decides status codes, one place decides what is safe
 * to expose, one place logs. Controllers just `throw`; they never format errors.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const { statusCode, message, errors, isUnexpected } = translate(err);

  if (isUnexpected) {
    // Log the full error + stack for unexpected failures so we can debug them.
    logger.error('Unhandled error', { error: err });
  } else {
    logger.warn(`Operational error: ${message}`, { statusCode });
  }

  // In non-production, surface the real message for unexpected errors to aid debugging.
  const clientMessage =
    isUnexpected && !config.isProduction && err instanceof Error ? err.message : message;

  sendFailure(res, clientMessage, statusCode, errors);
}
