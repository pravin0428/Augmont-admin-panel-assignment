import { body, param, type ValidationChain } from 'express-validator';

/**
 * Declarative validation rules for user endpoints (express-validator).
 * Colocated with the module so the contract for each endpoint is obvious.
 * `.bail()` stops the chain at the first failure to avoid confusing cascades.
 */

const emailRule = body('email')
  .trim()
  .notEmpty()
  .withMessage('Email is required')
  .bail()
  .isEmail()
  .withMessage('A valid email is required')
  .normalizeEmail();

// Strong-ish password policy: length + at least one letter and one number.
const passwordRule = body('password')
  .isString()
  .withMessage('Password is required')
  .bail()
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Za-z]/)
  .withMessage('Password must contain a letter')
  .matches(/\d/)
  .withMessage('Password must contain a number');

export const idParamRule: ValidationChain[] = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt(),
];

export const createUserRules: ValidationChain[] = [emailRule, passwordRule];

export const updateUserRules: ValidationChain[] = [
  ...idParamRule,
  emailRule.optional(),
  passwordRule.optional(),
];
