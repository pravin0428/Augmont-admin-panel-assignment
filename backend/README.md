# Backend — Product Management API

Express + TypeScript + Prisma + PostgreSQL. Layered architecture with SOLID principles; see the root [ARCHITECTURE.md](../ARCHITECTURE.md) for the reasoning behind every decision.

## Prerequisites

- Node.js ≥ 20
- A PostgreSQL instance

## Setup

```bash
npm install
cp .env.example .env          # set DATABASE_URL, JWT_SECRET, ...
npm run prisma:generate
npm run prisma:migrate        # apply migrations to your DB
npm run prisma:seed           # optional: admin@example.com / Admin@123 + samples
npm run dev                   # dev server with hot reload (tsx watch)
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Hot-reloading dev server (`tsx watch`) |
| `npm run build` | Compile TS → `dist/` and rewrite path aliases (`tsc` + `tsc-alias`) |
| `npm start` | Run the compiled server (`node dist/server.js`) |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Vitest unit tests |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:deploy` | Apply committed migrations (production) |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:seed` | Seed the database |

## Folder structure

```
src/
├── config/env.ts               # validated, typed environment config (fail-fast)
├── core/
│   ├── db/prisma.ts            # PrismaClient singleton (+ connect/disconnect)
│   ├── errors/                 # HttpStatus enum + typed AppError hierarchy
│   ├── middleware/             # authenticate, validate, error-handler, async-handler,
│   │                           #   not-found, rate-limit
│   ├── types/express.d.ts      # req.user augmentation
│   └── utils/                  # logger, api-response, password, jwt, pagination, file-storage
├── modules/                    # feature modules (each: routes/controller/service/repository/…)
│   ├── auth/  user/  category/
│   ├── product/                # + product.query, product.mapper, import/ (streaming bulk import)
│   ├── upload/                 # Multer image middleware
│   ├── report/                 # streaming CSV/XLSX export
│   └── health/
├── routes.ts                   # mounts all module routers under /api/v1
├── app.ts                      # Express assembly (helmet, cors, compression, morgan, …)
└── server.ts                   # bootstrap + graceful shutdown

prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

## Environment variables

See [`.env.example`](./.env.example). Key ones: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `MAX_IMAGE_SIZE_BYTES`, `BULK_IMPORT_BATCH_SIZE`, `CORS_ORIGINS`.

## Bulk import file format

CSV or XLSX with a header row. Columns:

| Column | Required | Notes |
|--------|----------|-------|
| `name` | ✔ | product name |
| `price` | ✔ | positive number |
| `category` | one of these | category **name** (resolved to id) |
| `categoryId` | one of these | existing category id |

Rows that fail validation (missing name, non-positive price, unknown category) are skipped and reported individually in the import summary, so a few bad rows never abort the whole import.

## Notes

- The API is versioned under `/api/v1`.
- All list/report/CRUD endpoints (except `/auth/*` and `/health/*`) require `Authorization: Bearer <token>`.
- See root README for the full endpoint table.
