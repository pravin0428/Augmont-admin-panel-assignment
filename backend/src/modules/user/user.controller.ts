import type { Request, Response } from 'express';
import { HttpStatus } from '@core/errors/http-status';
import { sendSuccess } from '@core/utils/api-response';
import { userService } from './user.service';

/**
 * User controller — the HTTP adapter.
 *
 * Responsibility: translate HTTP <-> service calls. It reads validated inputs
 * from the request, invokes the service, and shapes the response envelope. It
 * contains NO business logic (that lives in the service) — so the same service
 * could be driven by a CLI or a queue worker without change.
 *
 * `req.params.id` is already coerced to a number by the `.toInt()` validator.
 */
export const userController = {
  async list(_req: Request, res: Response): Promise<void> {
    const users = await userService.getAll();
    sendSuccess(res, users, 'Users retrieved successfully');
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const user = await userService.getById(id);
    sendSuccess(res, user, 'User retrieved successfully');
  },

  async create(req: Request, res: Response): Promise<void> {
    const user = await userService.create(req.body);
    sendSuccess(res, user, 'User created successfully', HttpStatus.CREATED);
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const user = await userService.update(id, req.body);
    sendSuccess(res, user, 'User updated successfully');
  },

  async remove(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    await userService.remove(id);
    sendSuccess(res, null, 'User deleted successfully');
  },
};
