import { prisma } from '@core/db/prisma';
import type { ICategoryRepository, SafeCategory } from './category.types';

const safeCategorySelect = {
  id: true,
  uniqueId: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const;

class CategoryRepository implements ICategoryRepository {
  findManyActive(): Promise<SafeCategory[]> {
    return prisma.category.findMany({
      where: { deletedAt: null },
      select: safeCategorySelect,
      orderBy: { name: 'asc' },
    });
  }

  findActiveById(id: number): Promise<SafeCategory | null> {
    return prisma.category.findFirst({
      where: { id, deletedAt: null },
      select: safeCategorySelect,
    });
  }

  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    const found = await prisma.category.findFirst({
      where: {
        // Case-insensitive uniqueness: "Shoes" and "shoes" are the same category.
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
        ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return found !== null;
  }

  /** Count non-deleted products in a category — used to block unsafe deletes. */
  countActiveProducts(categoryId: number): Promise<number> {
    return prisma.product.count({ where: { categoryId, deletedAt: null } });
  }

  create(data: { name: string }): Promise<SafeCategory> {
    return prisma.category.create({ data, select: safeCategorySelect });
  }

  update(id: number, data: { name?: string }): Promise<SafeCategory> {
    return prisma.category.update({ where: { id }, data, select: safeCategorySelect });
  }

  async softDelete(id: number): Promise<void> {
    await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const categoryRepository: ICategoryRepository = new CategoryRepository();
