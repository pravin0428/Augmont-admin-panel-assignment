import type { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import type { ApiFailure } from '../models/api.model';

/**
 * Central HTTP error handling.
 *
 * WHY here (not in every component): every request can fail the same handful of
 * ways (validation, auth, server down). Handling them once means:
 *   - a single, consistent error toast,
 *   - automatic logout + redirect on 401 (expired/invalid token),
 * and components only handle the SUCCESS path plus any error truly specific to
 * them. The original error is re-thrown so a component CAN still react if needed.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = extractMessage(error);

      if (error.status === 401) {
        // Token missing/expired/invalid — end the session and bounce to login.
        auth.logout();
        void router.navigate(['/login']);
      }

      notify.error(message);
      return throwError(() => error);
    }),
  );
};

/** Pull the most useful message out of the error, with sensible fallbacks. */
function extractMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Cannot reach the server. Please check your connection.';
  }
  const body = error.error as Partial<ApiFailure> | undefined;
  if (body && typeof body === 'object' && typeof body.message === 'string') {
    return body.message;
  }
  return error.message || 'An unexpected error occurred';
}
