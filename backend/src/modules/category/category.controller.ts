import type { Request, Response } from 'express';
import { HttpStatus } from '@core/errors/http-status';
import { sendSuccess } from '@core/utils/api-response';
import { categoryService } from './category.service';

export const categoryController = {
  async list(_req: Request, res: Response): Promise<void> {
    const categories = await categoryService.getAll();
    sendSuccess(res, categories, 'Categories retrieved successfully');
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const category = await categoryService.getById(Number(req.params.id));
    sendSuccess(res, category, 'Category retrieved successfully');
  },

  async create(req: Request, res: Response): Promise<void> {
    const category = await categoryService.create(req.body);
    sendSuccess(res, category, 'Category created successfully', HttpStatus.CREATED);
  },

  async update(req: Request, res: Response): Promise<void> {
    const category = await categoryService.update(Number(req.params.id), req.body);
    sendSuccess(res, category, 'Category updated successfully');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await categoryService.remove(Number(req.params.id));
    sendSuccess(res, null, 'Category deleted successfully');
  },
};
