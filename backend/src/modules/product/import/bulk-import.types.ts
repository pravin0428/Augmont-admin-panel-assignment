/** A single row that failed to import, with a human-readable reason. */
export interface ImportFailure {
  row: number; // 1-based row number in the source file (excluding header)
  reason: string;
}

/**
 * Summary returned after a bulk import completes.
 * Mirrors the assignment's required shape: totals + failures + duration.
 */
export interface ImportSummary {
  totalRecords: number;
  inserted: number;
  failed: number;
  failures: ImportFailure[];
  /** True when `failures` was capped (very large files) to bound response size. */
  failuresTruncated: boolean;
  durationMs: number;
}

/** Raw record as parsed from a file row before validation. */
export type RawRow = Record<string, string | undefined>;
