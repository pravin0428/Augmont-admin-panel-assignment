/**
 * Test bootstrap: provides the minimal env the config loader requires, so unit
 * tests can import modules that read `config` WITHOUT a real .env or database.
 * Runs before any test file (see `setupFiles` in vitest.config.ts).
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test?schema=public';
process.env.JWT_SECRET ??= 'test-secret-key-not-for-production';
process.env.BCRYPT_SALT_ROUNDS ??= '4'; // fast hashing in tests
