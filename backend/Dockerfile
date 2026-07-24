# ─────────────────────────────────────────────────────────────────────────────
# Backend Dockerfile — multi-stage build.
#
# WHY multi-stage: the BUILD stage carries the full toolchain (dev deps, TS
# compiler) to produce dist/. The RUNTIME stage ships only production deps + the
# compiled output, so the final image is smaller and has a reduced attack
# surface (no compiler, no source).
# ─────────────────────────────────────────────────────────────────────────────

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install ALL deps (incl. dev) using the lockfile for reproducible builds.
COPY package*.json ./
RUN npm ci

# Generate the Prisma client, then compile TypeScript → dist/.
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Production-only dependencies (prisma CLI is a prod dep so migrations can run).
COPY package*.json ./
RUN npm ci --omit=dev

# Bring over the generated Prisma client + engines from the build stage.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Compiled app + schema (needed for `prisma migrate deploy` at startup).
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Persist uploaded images outside the image layer (see compose volume).
RUN mkdir -p uploads
EXPOSE 4000

# Entrypoint applies DB migrations (and optional seed) before starting the API.
ENTRYPOINT ["./docker-entrypoint.sh"]
