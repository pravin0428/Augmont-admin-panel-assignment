import type { Request, Response } from 'express';
import { HttpStatus } from '@core/errors/http-status';
import { sendSuccess } from '@core/utils/api-response';
import { authService } from './auth.service';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 'Registration successful', HttpStatus.CREATED);
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful');
  },

  /** Returns the currently authenticated user (from the verified token). */
  async me(req: Request, res: Response): Promise<void> {
    // `authenticate` guarantees req.user is present on this route.
    sendSuccess(res, req.user, 'Authenticated user');
  },
};
