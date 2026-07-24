import { Prisma } from '@prisma/client';
import { prisma } from '@core/db/prisma';
import { toSafeProduct } from './product.mapper';
import { buildProductWhere } from './product.query';
import type {
  CreateProductInput,
  IProductRepository,
  ProductListCriteria,
  SafeProduct,
  UpdateProductInput,
} from './product.types';

// Always join the (lightweight) category so the client gets its name in one round trip.
const categoryInclude = {
  category: { select: { id: true, uniqueId: true, name: true } },
} as const;

class ProductRepository implements IProductRepository {
  /**
   * Server-side list: filter + sort + paginate.
   *
   * WHY count + rows run in ONE transaction: `$transaction` gives both queries a
   * consistent snapshot, so `total` and `data` can't disagree because of a write
   * landing between them. The two queries still run against the DB together.
   */
  async list(criteria: ProductListCriteria): Promise<{ data: SafeProduct[]; total: number }> {
    const where = buildProductWhere(criteria);
    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [criteria.sortBy]: criteria.order,
    };

    const [rows, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: categoryInclude,
        orderBy,
        skip: (criteria.page - 1) * criteria.limit,
        take: criteria.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { data: rows.map(toSafeProduct), total };
  }

  async findActiveById(id: number): Promise<SafeProduct | null> {
    const row = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: categoryInclude,
    });
    return row ? toSafeProduct(row) : null;
  }

  async create(data: CreateProductInput): Promise<SafeProduct> {
    const row = await prisma.product.create({
      data: {
        name: data.name,
        price: new Prisma.Decimal(data.price),
        categoryId: data.categoryId,
        image: data.image ?? null,
      },
      include: categoryInclude,
    });
    return toSafeProduct(row);
  }

  async update(id: number, data: UpdateProductInput): Promise<SafeProduct> {
    const row = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.price !== undefined ? { price: new Prisma.Decimal(data.price) } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.image !== undefined ? { image: data.image } : {}),
      },
      include: categoryInclude,
    });
    return toSafeProduct(row);
  }

  async softDelete(id: number): Promise<void> {
    await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const productRepository: IProductRepository = new ProductRepository();
