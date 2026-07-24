import type { Server } from 'node:http';
import { createApp } from './app';
import { config } from '@config/env';
import { logger } from '@core/utils/logger';
import { connectDatabase, disconnectDatabase } from '@core/db/prisma';
import { ensureUploadDir } from '@core/utils/file-storage';

/**
 * Server bootstrap.
 *
 * Order: verify dependencies (upload dir + DB) FIRST, then start listening. We
 * refuse to accept traffic if we can't reach the database ("fail fast"). We also
 * install graceful-shutdown handlers so in-flight requests finish and the DB
 * pool closes cleanly on SIGINT/SIGTERM (important for zero-downtime deploys).
 */
async function bootstrap(): Promise<void> {
  await ensureUploadDir();
  await connectDatabase();

  const app = createApp();
  const server: Server = app.listen(config.server.port, () => {
    logger.info(`API listening on http://localhost:${config.server.port} [${config.env}]`);
  });

  const shutdown = (signal: string): void => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('HTTP server closed. Bye.');
      process.exit(0);
    });
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error('Fatal error during startup', { error: err });
  process.exit(1);
});
