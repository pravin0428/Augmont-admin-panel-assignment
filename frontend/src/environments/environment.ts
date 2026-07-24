import type { AppEnvironment } from './environment.model';

/**
 * Development environment (the default). Overridden at build time by
 * `environment.prod.ts` via `fileReplacements` in angular.json.
 *
 * WHY a typed const (not scattered string literals): one place defines every
 * environment-dependent value, and the type stops typos/missing keys.
 */
export const environment: AppEnvironment = {
  production: false,
  apiUrl: 'http://localhost:4000/api/v1',
  assetBaseUrl: 'http://localhost:4000',
};
