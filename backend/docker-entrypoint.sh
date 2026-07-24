#!/bin/sh
# Container entrypoint: bring the database schema up to date, then start the API.
#
# WHY here (not in the Dockerfile): migrations need the DATABASE to be reachable,
# which only happens at RUN time (compose waits for Postgres to be healthy). We
# apply committed migrations with `migrate deploy` (the production-safe command —
# it never generates or resets, only applies pending migrations).
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

# Seed only when explicitly requested (idempotent). Enable with SEED_ON_START=true.
if [ "$SEED_ON_START" = "true" ]; then
  echo "Seeding database..."
  npx prisma db seed || echo "Seed skipped/failed (continuing)."
fi

echo "Starting API server..."
exec node dist/server.js
