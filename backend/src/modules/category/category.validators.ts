import { body, param, type ValidationChain } from 'express-validator';

export const idParamRule: ValidationChain[] = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt(),
];

const nameRule = body('name')
  .trim()
  .notEmpty()
  .withMessage('Category name is required')
  .bail()
  .isLength({ min: 2, max: 100 })
  .withMessage('Category name must be between 2 and 100 characters');

export const createCategoryRules: ValidationChain[] = [nameRule];

export const updateCategoryRules: ValidationChain[] = [...idParamRule, nameRule.optional()];
