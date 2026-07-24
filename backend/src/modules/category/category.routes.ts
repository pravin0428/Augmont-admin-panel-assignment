import { Router } from 'express';
import { authenticate } from '@core/middleware/authenticate';
import { asyncHandler } from '@core/middleware/async-handler';
import { validate } from '@core/middleware/validate';
import { categoryController } from './category.controller';
import {
  createCategoryRules,
  idParamRule,
  updateCategoryRules,
} from './category.validators';

const router = Router();

router.use(authenticate); // all category management is protected

router.get('/', asyncHandler(categoryController.list));
router.get('/:id', validate(idParamRule), asyncHandler(categoryController.getOne));
router.post('/', validate(createCategoryRules), asyncHandler(categoryController.create));
router.put('/:id', validate(updateCategoryRules), asyncHandler(categoryController.update));
router.delete('/:id', validate(idParamRule), asyncHandler(categoryController.remove));

export const categoryRoutes = router;
