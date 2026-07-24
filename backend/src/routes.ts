import { Router } from 'express';
import { authRoutes } from '@modules/auth/auth.routes';
import { userRoutes } from '@modules/user/user.routes';
import { categoryRoutes } from '@modules/category/category.routes';
import { productRoutes } from '@modules/product/product.routes';
import { reportRoutes } from '@modules/report/report.routes';
import { healthRoutes } from '@modules/health/health.routes';

/**
 * Single API router. Each feature module exposes its own router; we mount them
 * under a versioned prefix here. WHY version the API (/api/v1): lets us ship a
 * breaking v2 alongside v1 without breaking existing clients.
 */
const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/reports', reportRoutes);
router.use('/health', healthRoutes);

export const apiRouter = router;
