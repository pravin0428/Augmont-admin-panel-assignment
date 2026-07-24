import { PrismaClient, Prisma } from '@prisma/client';
import { config } from '@config/env';
import { logger } from '@core/utils/logger';

/**
 * Single, shared PrismaClient instance (the connection pool).
 *
 * WHY a singleton:
 *   - PrismaClient opens a pool of DB connections. Creating one per request (or
 *     per import) would exhaust Postgres connections under load.
 *   - In dev, `tsx watch` re-imports modules on save; without the `globalThis`
 *     guard we'd leak a new client + pool on every reload. Caching on globalThis
 *     survives hot-reload so we keep exactly one.
 */

const logLevels: Prisma.LogLevel[] = config.isProduction
  ? ['warn', 'error']
  : ['warn', 'error'];

function createPrismaClient(): PrismaClient {
  return new PrismaClient({ log: logLevels });
}

// Cache on globalThis so dev hot-reload reuses the same client.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (!config.isProduction) {
  globalForPrisma.prisma = prisma;
}

/** Verify DB connectivity at boot (fail fast if the DB is unreachable). */
export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connection established');
}

/** Gracefully close the pool on shutdown. */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database connection closed');
}
