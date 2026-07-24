import { Prisma } from '@prisma/client';
import type { SafeProduct } from './product.types';

/**
 * Prisma row shape we map from. `price` arrives as a Prisma.Decimal (exact),
 * and the category may or may not be joined in.
 */
type ProductRow = {
  id: number;
  uniqueId: string;
  name: string;
  image: string | null;
  price: Prisma.Decimal;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
  category?: { id: number; uniqueId: string; name: string } | null;
};

/**
 * Map a persistence row to the API DTO.
 *
 * WHY a dedicated mapper (not spreading the row): the DB row and the API contract
 * are DIFFERENT things. The mapper is the single boundary where we
 *   - convert Decimal → number for JSON, and
 *   - drop internal columns (deletedAt) from the response.
 * Changing the wire format later means editing one function.
 */
export function toSafeProduct(row: ProductRow): SafeProduct {
  return {
    id: row.id,
    uniqueId: row.uniqueId,
    name: row.name,
    image: row.image,
    // Decimal.toNumber() is safe for realistic prices; keep Decimal exact in the DB.
    price: row.price.toNumber(),
    categoryId: row.categoryId,
    ...(row.category ? { category: row.category } : {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
