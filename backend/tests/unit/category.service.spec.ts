import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryService } from '@modules/category/category.service';
import type { ICategoryRepository, SafeCategory } from '@modules/category/category.types';
import { ConflictError, NotFoundError } from '@core/errors/app-error';

/**
 * These tests demonstrate the payoff of Dependency Inversion: the service is
 * exercised with an in-memory FAKE repository — no database, fast, deterministic.
 */

const sampleCategory: SafeCategory = {
  id: 1,
  uniqueId: '11111111-1111-1111-1111-111111111111',
  name: 'Electronics',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createFakeRepo(overrides: Partial<ICategoryRepository> = {}): ICategoryRepository {
  return {
    findManyActive: vi.fn().mockResolvedValue([sampleCategory]),
    findActiveById: vi.fn().mockResolvedValue(sampleCategory),
    existsByName: vi.fn().mockResolvedValue(false),
    countActiveProducts: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockResolvedValue(sampleCategory),
    update: vi.fn().mockResolvedValue(sampleCategory),
    softDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('CategoryService', () => {
  let repo: ICategoryRepository;
  let service: CategoryService;

  beforeEach(() => {
    repo = createFakeRepo();
    service = new CategoryService(repo);
  });

  it('creates a category when the name is unique', async () => {
    const created = await service.create({ name: 'Electronics' });
    expect(created).toEqual(sampleCategory);
    expect(repo.create).toHaveBeenCalledWith({ name: 'Electronics' });
  });

  it('rejects a duplicate name with a ConflictError', async () => {
    repo = createFakeRepo({ existsByName: vi.fn().mockResolvedValue(true) });
    service = new CategoryService(repo);
    await expect(service.create({ name: 'Electronics' })).rejects.toBeInstanceOf(ConflictError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when fetching a missing category', async () => {
    repo = createFakeRepo({ findActiveById: vi.fn().mockResolvedValue(null) });
    service = new CategoryService(repo);
    await expect(service.getById(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('refuses to delete a category that still has products', async () => {
    repo = createFakeRepo({ countActiveProducts: vi.fn().mockResolvedValue(3) });
    service = new CategoryService(repo);
    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictError);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('soft-deletes a category with no products', async () => {
    await service.remove(1);
    expect(repo.softDelete).toHaveBeenCalledWith(1);
  });
});
