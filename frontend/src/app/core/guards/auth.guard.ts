import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard that blocks protected routes for unauthenticated users and
 * redirects them to /login, preserving the intended URL as a returnUrl.
 *
 * WHY a functional guard: same benefits as functional interceptors — tree-shakable,
 * no class boilerplate, uses inject(). Client-side guards are a UX convenience;
 * the API is the real security boundary (every protected endpoint verifies JWT).
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/** Inverse guard: keeps already-authenticated users off the login page. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
