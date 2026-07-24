/**
 * Environment contract, kept in its OWN file so it is NOT affected by the
 * `fileReplacements` swap (environment.ts → environment.prod.ts). If the
 * interface lived in environment.ts, environment.prod.ts's import of it would
 * resolve to itself in production builds and the type would disappear.
 */
export interface AppEnvironment {
  production: boolean;
  /** Base URL of the versioned API. */
  apiUrl: string;
  /** Origin used to resolve relative image paths returned by the API. */
  assetBaseUrl: string;
}
