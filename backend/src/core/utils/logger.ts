import winston from 'winston';
import { config } from '@config/env';

/**
 * Application-wide structured logger (Winston).
 *
 * WHY Winston over console.log:
 *   - Log LEVELS (error/warn/info/debug) so we can raise the bar in prod.
 *   - STRUCTURED output — JSON in production is machine-parseable by log
 *     aggregators (CloudWatch, Datadog, ELK). Pretty/coloured in dev for humans.
 *   - Single sink: swap transports (file, HTTP, syslog) without touching call sites.
 */

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Human-friendly format for local development.
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} ${level}: ${stack ?? message}`;
  }),
);

// Machine-readable JSON for production log pipelines.
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: config.logging.level,
  format: config.isProduction ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
  // Never let a logging failure crash the app.
  exitOnError: false,
});

/**
 * A Morgan-compatible stream so HTTP access logs flow through Winston too,
 * giving us a single, consistent logging pipeline.
 */
export const morganStream = {
  write: (message: string): void => {
    logger.http?.(message.trim()) ?? logger.info(message.trim());
  },
};
