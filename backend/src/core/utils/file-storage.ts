import { promises as fs } from 'node:fs';
import path from 'node:path';
import { config } from '@config/env';
import { logger } from '@core/utils/logger';

/**
 * Local disk storage helpers for uploaded files.
 *
 * NOTE (interview): local disk is fine for a single-node demo, but does NOT
 * scale horizontally (files live on one box) and is lost on container restart.
 * In production this module is the seam to swap for S3/GCS — only these
 * functions change, not the product code that calls them.
 */

const uploadRoot = path.resolve(process.cwd(), config.upload.dir);

/** Ensure the upload directory exists (called once at boot). */
export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(uploadRoot, { recursive: true });
}

/**
 * Delete a stored image given its public relative path (e.g. "uploads/x.png").
 * Best-effort: a missing file is not an error (idempotent cleanup).
 */
export async function deleteStoredImage(relativePath: string | null | undefined): Promise<void> {
  if (!relativePath) return;
  try {
    const absolute = path.resolve(process.cwd(), relativePath);
    // Guard against path traversal — never delete outside the upload root.
    if (!absolute.startsWith(uploadRoot)) return;
    await fs.unlink(absolute);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.warn(`Failed to delete image ${relativePath}`, { error: err });
    }
  }
}
