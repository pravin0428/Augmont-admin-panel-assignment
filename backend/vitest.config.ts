import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

/**
 * Vitest config. We mirror the tsconfig path aliases here so tests import the
 * same `@core/*`, `@modules/*`, `@config/*` specifiers as the app code.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@config': resolve(__dirname, 'src/config'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    globals: true,
    setupFiles: ['tests/setup.ts'],
  },
});
