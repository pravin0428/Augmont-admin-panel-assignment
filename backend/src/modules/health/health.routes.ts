import { Router } from 'express';
import { prisma } from '@core/db/prisma';
import { asyncHandler } from '@core/middleware/async-handler';
import { sendSuccess } from '@core/utils/api-response';
import { HttpStatus } from '@core/errors/http-status';
import { sendFailure } from '@core/utils/api-response';

/**
 * Health endpoints (bonus). Used by Docker/K8s and load balancers.
 *  - /health/live  : is the process up? (no dependencies)
 *  - /health/ready : are dependencies (DB) reachable? (gate traffic on this)
 */
const router = Router();

router.get('/live', (_req, res) => {
  sendSuccess(res, { status: 'ok', uptime: process.uptime() }, 'Service is live');
});

router.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      sendSuccess(res, { status: 'ready', database: 'up' }, 'Service is ready');
    } catch {
      sendFailure(res, 'Database is unavailable', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }),
);

export const healthRoutes = router;
