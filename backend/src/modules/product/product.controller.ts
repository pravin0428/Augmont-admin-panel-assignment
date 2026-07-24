import type { Request, Response } from 'express';
import { HttpStatus } from '@core/errors/http-status';
import { sendSuccess } from '@core/utils/api-response';
import { config } from '@config/env';
import { productService } from './product.service';
import type { ProductListCriteria, ProductSortField, SortOrder } from './product.types';

/**
 * Build the public path we persist for an uploaded image, or null if none.
 * Stored as a relative path (e.g. "uploads/<uuid>.png") which is served
 * statically — see app.ts.
 */
function imagePathFrom(req: Request): string | undefined {
  return req.file ? `${config.upload.dir}/${req.file.filename}` : undefined;
}

/**
 * Read the (already validated + coerced) query string into normalised list
 * criteria with sensible defaults. Because the validators ran `.toInt()/.toFloat()`,
 * these values are real numbers at runtime.
 */
function buildListCriteria(req: Request): ProductListCriteria {
  const q = req.query as Record<string, unknown>;
  return {
    page: (q.page as number) ?? 1,
    limit: (q.limit as number) ?? 10,
    sortBy: (q.sortBy as ProductSortField) ?? 'createdAt',
    order: (q.order as SortOrder) ?? 'desc',
    ...(q.search ? { search: q.search as string } : {}),
    ...(q.categoryId !== undefined ? { categoryId: q.categoryId as number } : {}),
    ...(q.minPrice !== undefined ? { minPrice: q.minPrice as number } : {}),
    ...(q.maxPrice !== undefined ? { maxPrice: q.maxPrice as number } : {}),
  };
}

export const productController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await productService.list(buildListCriteria(req));
    // The paginated envelope (data/total/page/limit/totalPages) IS the payload.
    sendSuccess(res, result, 'Products retrieved successfully');
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const product = await productService.getById(Number(req.params.id));
    sendSuccess(res, product, 'Product retrieved successfully');
  },

  async create(req: Request, res: Response): Promise<void> {
    const product = await productService.create({
      name: req.body.name,
      price: req.body.price,
      categoryId: req.body.categoryId,
      image: imagePathFrom(req) ?? null,
    });
    sendSuccess(res, product, 'Product created successfully', HttpStatus.CREATED);
  },

  async update(req: Request, res: Response): Promise<void> {
    const image = imagePathFrom(req);
    const product = await productService.update(Number(req.params.id), {
      ...(req.body.name !== undefined ? { name: req.body.name } : {}),
      ...(req.body.price !== undefined ? { price: req.body.price } : {}),
      ...(req.body.categoryId !== undefined ? { categoryId: req.body.categoryId } : {}),
      ...(image !== undefined ? { image } : {}),
    });
    sendSuccess(res, product, 'Product updated successfully');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await productService.remove(Number(req.params.id));
    sendSuccess(res, null, 'Product deleted successfully');
  },
};
