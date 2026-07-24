import { body, param, query, type ValidationChain } from 'express-validator';
import { MAX_PAGE_SIZE } from '@core/utils/pagination';

/**
 * Product validation rules.
 *
 * NOTE: create/update use multipart/form-data (image upload), so text fields
 * arrive as STRINGS. We coerce with `.toFloat()` / `.toInt()` after validating,
 * so downstream code receives real numbers.
 */

export const idParamRule: ValidationChain[] = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt(),
];

const nameRule = body('name')
  .trim()
  .notEmpty()
  .withMessage('Product name is required')
  .bail()
  .isLength({ min: 2, max: 150 })
  .withMessage('Product name must be between 2 and 150 characters');

const priceRule = body('price')
  .notEmpty()
  .withMessage('Price is required')
  .bail()
  .isFloat({ gt: 0 })
  .withMessage('Price must be a positive number')
  .toFloat();

const categoryIdRule = body('categoryId')
  .notEmpty()
  .withMessage('categoryId is required')
  .bail()
  .isInt({ min: 1 })
  .withMessage('categoryId must be a positive integer')
  .toInt();

export const createProductRules: ValidationChain[] = [nameRule, priceRule, categoryIdRule];

export const updateProductRules: ValidationChain[] = [
  ...idParamRule,
  nameRule.optional(),
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number').toFloat(),
  body('categoryId').optional().isInt({ min: 1 }).withMessage('categoryId must be a positive integer').toInt(),
];

/** Validation + coercion for the list query string. */
export const listProductRules: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_PAGE_SIZE })
    .withMessage(`limit must be between 1 and ${MAX_PAGE_SIZE}`)
    .toInt(),
  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'createdAt'])
    .withMessage('sortBy must be one of: name, price, createdAt'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order must be asc or desc'),
  query('search').optional().trim().isLength({ max: 150 }).withMessage('search is too long'),
  query('categoryId').optional().isInt({ min: 1 }).withMessage('categoryId must be a positive integer').toInt(),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be >= 0').toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be >= 0').toFloat(),
];
