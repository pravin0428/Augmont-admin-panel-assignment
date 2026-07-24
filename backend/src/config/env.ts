import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralised, validated, strongly-typed configuration.
 *
 * WHY: Reading `process.env.X` ad-hoc across the codebase is fragile —
 *   - values are `string | undefined`, so every call site must re-validate,
 *   - a missing/misspelled var fails deep inside a request instead of at boot.
 * We validate ONCE here and export a frozen, typed object. If a required var is
 * missing the process refuses to start ("fail fast"), which is what you want in
 * production — a mis-configured server should never accept traffic.
 */

type NodeEnv = 'development' | 'test' | 'production';

/** Read a required string env var or throw with a clear message. */
function requireString(key: string): string {
  const value = process.env[key];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/** Read an optional string with a default. */
function optionalString(key: string, fallback: string): string {
  const value = process.env[key];
  return value === undefined || value.trim() === '' ? fallback : value;
}

/** Read and coerce a numeric env var, validating it is a finite number. */
function numberFromEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, received "${raw}"`);
  }
  return parsed;
}

const nodeEnv = optionalString('NODE_ENV', 'development') as NodeEnv;

export const config = {
  env: nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',

  server: {
    port: numberFromEnv('PORT', 4000),
    corsOrigins: optionalString('CORS_ORIGINS', 'http://localhost:4200')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },

  database: {
    url: requireString('DATABASE_URL'),
  },

  auth: {
    jwtSecret: requireString('JWT_SECRET'),
    jwtExpiresIn: optionalString('JWT_EXPIRES_IN', '1d'),
    bcryptSaltRounds: numberFromEnv('BCRYPT_SALT_ROUNDS', 10),
  },

  upload: {
    dir: optionalString('UPLOAD_DIR', 'uploads'),
    maxImageSizeBytes: numberFromEnv('MAX_IMAGE_SIZE_BYTES', 2 * 1024 * 1024),
    bulkImportBatchSize: numberFromEnv('BULK_IMPORT_BATCH_SIZE', 500),
  },

  rateLimit: {
    windowMs: numberFromEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: numberFromEnv('RATE_LIMIT_MAX', 300),
  },

  logging: {
    level: optionalString('LOG_LEVEL', 'info'),
  },
} as const;

export type AppConfig = typeof config;
