import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer, { type FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { config } from '@config/env';

/**
 * Multer config for the bulk import file (CSV / XLSX).
 *
 * WHY diskStorage (never memoryStorage) here especially: import files can be
 * huge (100k+ rows). memoryStorage would buffer the ENTIRE file on the heap and
 * risk OOM. diskStorage streams it to a temp file which we then read as a stream
 * — constant memory regardless of file size.
 *
 * A generous size limit (50 MB) is allowed since these are data files, not images.
 */

const ALLOWED_EXT = new Set(['.csv', '.xlsx']);
const MAX_IMPORT_BYTES = 50 * 1024 * 1024; // 50 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.upload.dir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `import-${randomUUID()}${ext}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXT.has(ext)) {
    cb(null, true);
    return;
  }
  cb(new Error('Only .csv and .xlsx files are supported for bulk import'));
}

export const uploadImportFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMPORT_BYTES },
}).single('file');
