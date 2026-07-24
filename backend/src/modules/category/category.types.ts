/** Category as exposed by the API. `uniqueId` is the public UUID handle. */
export interface SafeCategory {
  id: number;
  uniqueId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  name?: string;
}

/** Repository abstraction the CategoryService depends on (DIP). */
export interface ICategoryRepository {
  findManyActive(): Promise<SafeCategory[]>;
  findActiveById(id: number): Promise<SafeCategory | null>;
  existsByName(name: string, excludeId?: number): Promise<boolean>;
  countActiveProducts(categoryId: number): Promise<number>;
  create(data: { name: string }): Promise<SafeCategory>;
  update(id: number, data: { name?: string }): Promise<SafeCategory>;
  softDelete(id: number): Promise<void>;
}
