import type { NextFunction, Request, Response } from 'express';
import { validationResult, type ValidationChain } from 'express-validator';
import { BadRequestError, type FieldError } from '@core/errors/app-error';

/**
 * Runs a set of express-validator chains, then aggregates any failures into a
 * single BadRequestError (422/400) carrying field-level messages.
 *
 * WHY this wrapper:
 *   - Validation rules live next to each route (declarative, colocated).
 *   - The rules only *record* errors; this middleware is the single place that
 *     decides "if there were errors, reject". That keeps controllers free of
 *     validation boilerplate and guarantees a consistent error shape.
 *
 * Usage:  router.post('/', validate(createUserRules), controller.create)
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Run all chains in parallel; each populates the shared validation context.
    await Promise.all(validations.map((validation) => validation.run(req)));

    const result = validationResult(req);
    if (result.isEmpty()) {
      next();
      return;
    }

    const errors: FieldError[] = result.array().map((err) => ({
      // `type: 'field'` errors expose `path`; fall back gracefully otherwise.
      field: err.type === 'field' ? err.path : err.type,
      message: err.msg as string,
    }));

    next(new BadRequestError('Validation failed', errors));
  };
}
