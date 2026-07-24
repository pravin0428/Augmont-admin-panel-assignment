import type { AppEnvironment } from './environment.model';

/**
 * Production environment. In the Docker setup the frontend is served by nginx,
 * which reverse-proxies `/api` and `/uploads` to the backend — so we use
 * same-origin relative URLs and avoid CORS entirely in production.
 */
export const environment: AppEnvironment = {
  production: true,
  apiUrl: '/api/v1',
  assetBaseUrl: '',
};
