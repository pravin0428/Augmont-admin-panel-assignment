import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from '@modules/product/product.service';
import type { IProductRepository, SafeProduct } from '@modules/product/product.types';
import type { ICategoryRepository, SafeCategory } from '@modules/category/category.types';
import { BadRequestError, NotFoundError } from '@core/errors/app-error';

const category: SafeCategory = {
  id: 1,
  uniqueId: 'c1',
  name: 'Electronics',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const product: SafeProduct = {
  id: 10,
  uniqueId: 'p10',
  name: 'Mouse',
  image: null,
  price: 24.99,
  categoryId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function fakeProductRepo(overrides: Partial<IProductRepository> = {}): IProductRepository {
  return {
    list: vi.fn().mockResolvedValue({ data: [product], total: 1 }),
    findActiveById: vi.fn().mockResolvedValue(product),
    create: vi.fn().mockResolvedValue(product),
    update: vi.fn().mockResolvedValue(product),
    softDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function fakeCategoryRepo(exists = true): ICategoryRepository {
  return {
    findManyActive: vi.fn(),
    findActiveById: vi.fn().mockResolvedValue(exists ? category : null),
    existsByName: vi.fn(),
    countActiveProducts: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  };
}

describe('ProductService', () => {
  let productRepo: IProductRepository;
  let service: ProductService;

  beforeEach(() => {
    productRepo = fakeProductRepo();
    service = new ProductService(productRepo, fakeCategoryRepo(true));
  });

  it('lists products in a paginated envelope', async () => {
    const result = await service.list({ page: 1, limit: 10, sortBy: 'createdAt', order: 'desc' });
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.data).toEqual([product]);
  });

  it('creates a product when the category exists', async () => {
    const created = await service.create({ name: 'Mouse', price: 24.99, categoryId: 1 });
    expect(created).toEqual(product);
    expect(productRepo.create).toHaveBeenCalled();
  });

  it('rejects creation with a non-existent category (BadRequest, not 404)', async () => {
    service = new ProductService(productRepo, fakeCategoryRepo(false));
    await expect(
      service.create({ name: 'Mouse', price: 24.99, categoryId: 999 }),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(productRepo.create).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the product is missing', async () => {
    service = new ProductService(
      fakeProductRepo({ findActiveById: vi.fn().mockResolvedValue(null) }),
      fakeCategoryRepo(true),
    );
    await expect(service.getById(123)).rejects.toBeInstanceOf(NotFoundError);
  });
});
