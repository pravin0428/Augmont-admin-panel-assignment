import { Router } from 'express';
import { authenticate } from '@core/middleware/authenticate';
import { asyncHandler } from '@core/middleware/async-handler';
import { validate } from '@core/middleware/validate';
import { reportController } from './report.controller';
import { reportQueryRules } from './report.validators';

const router = Router();

router.use(authenticate);

// GET /reports/products?format=csv|xlsx&search=&categoryId=&minPrice=&maxPrice=
router.get('/products', validate(reportQueryRules), asyncHandler(reportController.download));

export const reportRoutes = router;
