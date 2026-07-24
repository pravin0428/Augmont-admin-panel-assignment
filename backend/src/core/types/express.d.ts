import 'express';

/**
 * Augment Express' Request type so `req.user` is strongly typed everywhere
 * after the auth middleware runs.
 *
 * WHY: without this, controllers would cast `(req as any).user`, losing type
 * safety. Declaration merging lets us extend the framework type cleanly.
 */
declare global {
  namespace Express {
    interface AuthenticatedUser {
      id: number;
      email: string;
    }

    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
