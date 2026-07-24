import { describe, it, expect } from 'vitest';
import {
  buildPaginatedResult,
  resolvePagination,
  MAX_PAGE_SIZE,
} from '@core/utils/pagination';

describe('resolvePagination', () => {
  it('applies defaults when inputs are missing', () => {
    const result = resolvePagination(undefined, undefined);
    expect(result).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it('computes skip from page and limit', () => {
    expect(resolvePagination(3, 20)).toEqual({ page: 3, limit: 20, skip: 40 });
  });

  it('clamps limit to the maximum page size (DoS guard)', () => {
    const result = resolvePagination(1, 100_000);
    expect(result.limit).toBe(MAX_PAGE_SIZE);
  });

  it('falls back to defaults for invalid (<=0 / NaN) inputs', () => {
    expect(resolvePagination(-5, 0).page).toBe(1);
    expect(resolvePagination(Number.NaN, Number.NaN).limit).toBe(10);
  });
});

describe('buildPaginatedResult', () => {
  it('computes totalPages via ceil', () => {
    const result = buildPaginatedResult([1, 2, 3], 25, { page: 1, limit: 10, skip: 0 });
    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(25);
    expect(result.data).toHaveLength(3);
  });

  it('returns 0 totalPages when there are no rows', () => {
    const result = buildPaginatedResult([], 0, { page: 1, limit: 10, skip: 0 });
    expect(result.totalPages).toBe(0);
  });
});
