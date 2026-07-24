import { Injectable, computed, signal } from '@angular/core';

/**
 * Tracks the number of in-flight HTTP requests so the app can show a global
 * loading indicator. The loading INTERCEPTOR increments on request start and
 * decrements on completion.
 *
 * WHY a counter (not a boolean): concurrent requests must not hide the spinner
 * prematurely. The spinner is visible while the count is > 0.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly activeRequests = signal(0);

  /** True while at least one HTTP request is pending. */
  readonly isLoading = computed(() => this.activeRequests() > 0);

  start(): void {
    this.activeRequests.update((n) => n + 1);
  }

  stop(): void {
    this.activeRequests.update((n) => Math.max(0, n - 1));
  }
}
