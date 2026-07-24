export interface ImportFailure {
  row: number;
  reason: string;
}

/** Mirrors the backend bulk-import summary. */
export interface ImportSummary {
  totalRecords: number;
  inserted: number;
  failed: number;
  failures: ImportFailure[];
  failuresTruncated: boolean;
  durationMs: number;
}

/** Report export options shared with the reports page. */
export interface ReportFilter {
  format: 'csv' | 'xlsx';
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}
