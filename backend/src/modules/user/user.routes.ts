import { Router } from 'express';
import { authenticate } from '@core/middleware/authenticate';
import { asyncHandler } from '@core/middleware/async-handler';
import { validate } from '@core/middleware/validate';
import { userController } from './user.controller';
import { createUserRules, idParamRule, updateUserRules } from './user.validators';

/**
 * User routes. Every route is protected — user management is admin-only.
 * `authenticate` is applied router-wide so no individual route can forget it.
 */
const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(userController.list));
router.get('/:id', validate(idParamRule), asyncHandler(userController.getOne));
router.post('/', validate(createUserRules), asyncHandler(userController.create));
router.put('/:id', validate(updateUserRules), asyncHandler(userController.update));
router.delete('/:id', validate(idParamRule), asyncHandler(userController.remove));

export const userRoutes = router;
