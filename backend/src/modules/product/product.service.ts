import { BadRequestError, NotFoundError } from '@core/errors/app-error';
import { buildPaginatedResult, type PaginatedResult } from '@core/utils/pagination';
import { deleteStoredImage } from '@core/utils/file-storage';
import { categoryRepository } from '@modules/category/category.repository';
import type { ICategoryRepository } from '@modules/category/category.types';
import { productRepository } from './product.repository';
import type {
  CreateProductInput,
  IProductRepository,
  ProductListCriteria,
  SafeProduct,
  UpdateProductInput,
} from './product.types';

/**
 * Product business logic.
 *
 * Cross-module rule: a product MUST reference an existing category. We verify
 * that here (via the category repository abstraction) so the rule holds no
 * matter who calls — HTTP create, bulk import, or a test.
 */
export class ProductService {
  constructor(
    private readonly repo: IProductRepository,
    private readonly categories: ICategoryRepository,
  ) {}

  async list(criteria: ProductListCriteria): Promise<PaginatedResult<SafeProduct>> {
    const { data, total } = await this.repo.list(criteria);
    return buildPaginatedResult(data, total, {
      page: criteria.page,
      limit: criteria.limit,
      skip: (criteria.page - 1) * criteria.limit,
    });
  }

  async getById(id: number): Promise<SafeProduct> {
    const product = await this.repo.findActiveById(id);
    if (!product) throw new NotFoundError('Product');
    return product;
  }

  /** Throws BadRequest if the category is missing — a client error, not a 404. */
  private async assertCategoryExists(categoryId: number): Promise<void> {
    const category = await this.categories.findActiveById(categoryId);
    if (!category) {
      throw new BadRequestError('The specified category does not exist', [
        { field: 'categoryId', message: 'Category not found' },
      ]);
    }
  }

  async create(input: CreateProductInput): Promise<SafeProduct> {
    await this.assertCategoryExists(input.categoryId);
    return this.repo.create(input);
  }

  async update(id: number, input: UpdateProductInput): Promise<SafeProduct> {
    const existing = await this.getById(id);
    if (input.categoryId !== undefined) {
      await this.assertCategoryExists(input.categoryId);
    }

    const updated = await this.repo.update(id, input);

    // If the image was replaced, remove the old file so it doesn't leak disk.
    if (input.image !== undefined && existing.image && existing.image !== input.image) {
      await deleteStoredImage(existing.image);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    const existing = await this.getById(id);
    await this.repo.softDelete(id);
    // Soft delete keeps the row; we still reclaim the image file.
    await deleteStoredImage(existing.image);
  }
}

export const productService = new ProductService(productRepository, categoryRepository);
