import { query, type ValidationChain } from 'express-validator';

/** Report export accepts the same filters as the product list, plus a format. */
export const reportQueryRules: ValidationChain[] = [
  query('format').optional().isIn(['csv', 'xlsx']).withMessage('format must be csv or xlsx'),
  query('search').optional().trim().isLength({ max: 150 }).withMessage('search is too long'),
  query('categoryId').optional().isInt({ min: 1 }).withMessage('categoryId must be a positive integer').toInt(),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be >= 0').toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be >= 0').toFloat(),
];
