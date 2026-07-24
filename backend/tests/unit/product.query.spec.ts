import { describe, it, expect } from 'vitest';
import { buildProductWhere } from '@modules/product/product.query';

describe('buildProductWhere', () => {
  it('always excludes soft-deleted rows', () => {
    expect(buildProductWhere({}).deletedAt).toBeNull();
  });

  it('adds a case-insensitive name contains filter for search', () => {
    const where = buildProductWhere({ search: 'mouse' });
    expect(where.name).toEqual({ contains: 'mouse', mode: 'insensitive' });
  });

  it('filters by categoryId when provided', () => {
    expect(buildProductWhere({ categoryId: 7 }).categoryId).toBe(7);
  });

  it('builds a price range with only the supplied bounds', () => {
    expect(buildProductWhere({ minPrice: 10 }).price).toEqual({ gte: 10 });
    expect(buildProductWhere({ maxPrice: 50 }).price).toEqual({ lte: 50 });
    expect(buildProductWhere({ minPrice: 10, maxPrice: 50 }).price).toEqual({
      gte: 10,
      lte: 50,
    });
  });

  it('omits price when no bounds are given', () => {
    expect(buildProductWhere({ search: 'x' }).price).toBeUndefined();
  });
});
