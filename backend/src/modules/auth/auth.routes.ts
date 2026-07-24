import { Router } from 'express';
import { asyncHandler } from '@core/middleware/async-handler';
import { validate } from '@core/middleware/validate';
import { authenticate } from '@core/middleware/authenticate';
import { authRateLimiter } from '@core/middleware/rate-limit';
import { authController } from './auth.controller';
import { loginRules, registerRules } from './auth.validators';

const router = Router();

// Public endpoints, protected by the stricter auth rate limiter.
router.post('/register', authRateLimiter, validate(registerRules), asyncHandler(authController.register));
router.post('/login', authRateLimiter, validate(loginRules), asyncHandler(authController.login));

// Protected — echoes the token's identity; handy for the frontend on boot.
router.get('/me', authenticate, asyncHandler(authController.me));

export const authRoutes = router;
