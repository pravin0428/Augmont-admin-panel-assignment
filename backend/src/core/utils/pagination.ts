/**
 * Shared pagination primitives.
 *
 * WHY a shared type: the Product list API and any future list endpoint should
 * return the SAME envelope so the frontend has one paginator to reason about.
 */

/** Normalised, safe pagination inputs (already clamped). */
export interface PaginationParams {
  page: number;
  limit: number;
  /** Rows to skip — derived, so callers never compute offsets by hand. */
  skip: number;
}

/** The list envelope every paginated endpoint returns. */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Hard ceiling so a client cannot request `?limit=1000000` and DoS the DB. */
export const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

/**
 * Clamp raw page/limit inputs into safe bounds and compute `skip`.
 * Defensive even though validators also check — the service must be safe on its
 * own (never trust that a caller validated).
 */
export function resolvePagination(rawPage?: number, rawLimit?: number): PaginationParams {
  const page = Number.isFinite(rawPage) && (rawPage as number) > 0 ? Math.floor(rawPage as number) : DEFAULT_PAGE;
  const limitCandidate =
    Number.isFinite(rawLimit) && (rawLimit as number) > 0 ? Math.floor(rawLimit as number) : DEFAULT_LIMIT;
  const limit = Math.min(limitCandidate, MAX_PAGE_SIZE);
  return { page, limit, skip: (page - 1) * limit };
}

/** Build the final envelope from rows + total count. */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResult<T> {
  return {
    data,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit) || 0,
  };
}
