import { body, type ValidationChain } from 'express-validator';

/** Registration requires a valid email and a policy-compliant password. */
export const registerRules: ValidationChain[] = [
  body('email').trim().notEmpty().withMessage('Email is required').bail().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isString()
    .withMessage('Password is required')
    .bail()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
];

/**
 * Login only checks presence/format — NOT the password policy. WHY: policy
 * rules can change over time; enforcing them at login would lock out existing
 * valid accounts. Login just needs a well-formed email and a non-empty password.
 */
export const loginRules: ValidationChain[] = [
  body('email').trim().notEmpty().withMessage('Email is required').bail().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];
