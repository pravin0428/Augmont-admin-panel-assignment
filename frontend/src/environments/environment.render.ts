import type { AppEnvironment } from './environment.model';

/**
 * Render (static-site) environment. The frontend is served as a static SPA from
 * Render's CDN and talks to the separately-deployed backend over its PUBLIC URL
 * (cross-origin → the backend enables CORS for this site's origin).
 *
 * Kept separate from environment.prod.ts (which uses same-origin '/api/v1' for
 * the nginx/docker-compose setup), so both deployment styles stay valid.
 */
export const environment: AppEnvironment = {
  production: true,
  apiUrl: 'https://augmont-backend.onrender.com/api/v1',
  assetBaseUrl: 'https://augmont-backend.onrender.com',
};
