export interface ProductCategoryRef {
  id: number;
  uniqueId: string;
  name: string;
}

export interface Product {
  id: number;
  uniqueId: string;
  name: string;
  image: string | null;
  price: number;
  categoryId: number;
  category?: ProductCategoryRef;
  createdAt: string;
  updatedAt: string;
}

export type ProductSortField = 'name' | 'price' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

/** Query parameters for the product list endpoint. */
export interface ProductListParams {
  page: number;
  limit: number;
  sortBy: ProductSortField;
  order: SortOrder;
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}

/** Fields for create/update. Image is a File (multipart); handled by the service. */
export interface ProductFormValue {
  name: string;
  price: number;
  categoryId: number;
  image?: File | null;
}
