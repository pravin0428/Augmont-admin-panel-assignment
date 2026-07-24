import { Prisma } from '@prisma/client';

/** Filter inputs shared by the list API and the report export. */
export interface ProductFilter {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Build the Prisma `where` clause from filter criteria.
 *
 * WHY extract this: the list endpoint AND the report export must filter
 * IDENTICALLY (same search/category/price semantics). Sharing one builder
 * guarantees the report reflects exactly what the list shows — no drift.
 *
 * Always excludes soft-deleted rows.
 */
export function buildProductWhere(filter: ProductFilter): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { deletedAt: null };

  if (filter.search) {
    // Case-insensitive partial match on name.
    where.name = { contains: filter.search, mode: 'insensitive' };
  }

  if (filter.categoryId !== undefined) {
    where.categoryId = filter.categoryId;
  }

  // Range filter on price; only add bounds that were supplied.
  if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
    where.price = {
      ...(filter.minPrice !== undefined ? { gte: filter.minPrice } : {}),
      ...(filter.maxPrice !== undefined ? { lte: filter.maxPrice } : {}),
    };
  }

  return where;
}
