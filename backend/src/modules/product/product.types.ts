/** Product as exposed by the API. Price is a `number` (Decimal → number at the mapper). */
export interface SafeProduct {
  id: number;
  uniqueId: string;
  name: string;
  image: string | null;
  price: number;
  categoryId: number;
  category?: { id: number; uniqueId: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  price: number;
  categoryId: number;
  image?: string | null;
}

export interface UpdateProductInput {
  name?: string;
  price?: number;
  categoryId?: number;
  image?: string | null;
}

/** Columns the client is permitted to sort by (whitelist — see service). */
export type ProductSortField = 'name' | 'price' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

/** Normalised filter/sort/paginate criteria for listing products. */
export interface ProductListCriteria {
  page: number;
  limit: number;
  sortBy: ProductSortField;
  order: SortOrder;
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}

/** Repository abstraction for products (DIP). */
export interface IProductRepository {
  list(criteria: ProductListCriteria): Promise<{ data: SafeProduct[]; total: number }>;
  findActiveById(id: number): Promise<SafeProduct | null>;
  create(data: CreateProductInput): Promise<SafeProduct>;
  update(id: number, data: UpdateProductInput): Promise<SafeProduct>;
  softDelete(id: number): Promise<void>;
}
