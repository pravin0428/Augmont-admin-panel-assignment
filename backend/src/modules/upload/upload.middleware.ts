import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer, { type FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { config } from '@config/env';

/**
 * Multer configuration for product image uploads.
 *
 * Decisions:
 *  - diskStorage (not memoryStorage): keeps large files OFF the heap. A big
 *    upload streams straight to disk instead of buffering in RAM.
 *  - Filenames are randomised UUIDs (never the user's filename): prevents path
 *    traversal, collisions, and overwrites from attacker-controlled names.
 *  - Two-layer type check: MIME type AND extension must both be in the allow
 *    list. MIME alone is client-supplied and spoofable; extension alone is weak.
 *  - fileSize limit enforced by Multer itself — it aborts the stream early
 *    instead of accepting the whole oversized file first.
 */

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME.has(file.mimetype);
  const extOk = ALLOWED_EXT.has(ext);

  if (mimeOk && extOk) {
    cb(null, true);
    return;
  }
  // Reject with a clear message; surfaced as 400 by the error handler.
  cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed'));
}

/** Single-file middleware for the "image" form field. */
export const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxImageSizeBytes },
}).single('image');
