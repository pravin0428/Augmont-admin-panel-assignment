import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

/**
 * Root application providers (standalone bootstrap — no NgModules).
 *
 * Interceptor ORDER is significant. Interceptors run top-to-bottom on the way
 * OUT and bottom-to-top on the way BACK:
 *   1. loading  — starts the spinner first, stops it last (wraps everything).
 *   2. jwt      — attaches the token to the outgoing request.
 *   3. error    — closest to the response, so it sees the final error and
 *                 handles 401/toasts.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(),
      withInterceptors([loadingInterceptor, jwtInterceptor, errorInterceptor]),
    ),
    // NOTE: Angular Material 20.2+ uses native CSS animations, so the legacy
    // @angular/animations provider (deprecated in 20.2) is intentionally omitted.
  ],
};
