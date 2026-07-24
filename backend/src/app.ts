import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { config } from '@config/env';
import { morganStream } from '@core/utils/logger';
import { globalRateLimiter } from '@core/middleware/rate-limit';
import { notFoundHandler } from '@core/middleware/not-found';
import { errorHandler } from '@core/middleware/error-handler';
import { apiRouter } from './routes';

/**
 * Builds and configures the Express application.
 *
 * WHY a factory that returns the app (instead of listening here): separating app
 * ASSEMBLY from server STARTUP lets tests import the app and hit it with
 * supertest WITHOUT opening a port. `server.ts` is the only place that listens.
 *
 * Middleware ORDER matters and is deliberate:
 *   security → cors → parsing → compression → logging → rate limit → routes
 *   → 404 → central error handler (must be last).
 */
export function createApp(): Application {
  const app = express();

  // Behind a reverse proxy / load balancer (Docker, nginx) so rate-limit and
  // protocol detection use the real client IP from X-Forwarded-* headers.
  app.set('trust proxy', 1);

  // 1. Security headers (CSP, HSTS, no-sniff, etc.).
  app.use(helmet());

  // 2. CORS — only our known frontend origins may call the API from a browser.
  app.use(
    cors({
      origin: config.server.corsOrigins,
      credentials: true,
    }),
  );

  // 3. Body parsers with a sane size cap (defends against huge JSON payloads).
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. gzip responses to cut bandwidth.
  app.use(compression());

  // 5. HTTP access logging routed through Winston (single log pipeline).
  app.use(morgan(config.isProduction ? 'combined' : 'dev', { stream: morganStream }));

  // 6. Global rate limiting.
  app.use(globalRateLimiter);

  // 7. Serve uploaded images statically (read-only, from the upload dir).
  app.use('/uploads', express.static(config.upload.dir));

  // 8. Versioned API.
  app.use('/api/v1', apiRouter);

  // 9. Unmatched routes → 404 (funnelled through the error handler).
  app.use(notFoundHandler);

  // 10. Central error handler — MUST be registered last.
  app.use(errorHandler);

  return app;
}
