import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Attaches the JWT as a Bearer token to every outgoing request when present.
 *
 * WHY a functional interceptor (Angular's modern API): no class/DI boilerplate,
 * composes cleanly in `withInterceptors([...])`, and `inject()` gives us the
 * AuthService inside the function. Centralising this means no component ever
 * hand-builds an auth header.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token;

  if (token) {
    return next(
      req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
    );
  }
  return next(req);
};
