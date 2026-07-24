# Product Management System

A production-grade full-stack application for managing users, categories, and products — featuring JWT auth, image uploads, a server-side product list (pagination/sort/search/filter), **streaming bulk import** and **streaming report export** that never time out, all wrapped in a clean Angular 20 Material UI.

---

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Angular 20 (standalone APIs, Signals), Angular Material, RxJS, Reactive Forms, SCSS |
| Backend   | Node.js, Express, TypeScript (strict), Prisma ORM |
| Database  | PostgreSQL |
| Auth      | JWT + bcrypt |
| Files     | Multer (upload), csv-parser + ExcelJS (streaming import/export) |
| Ops       | Docker + docker-compose, Winston, Helmet, CORS, Compression, Morgan |
| Testing   | Vitest (backend) |

---

## Repository layout

```
assign/
├── backend/        # Express + TypeScript + Prisma API  (see backend/README.md)
├── frontend/       # Angular 20 SPA                      (see frontend/README.md)
├── postman/        # Postman collection for the whole API
├── docker-compose.yml
└── README.md       # you are here
```

---

## Deploy on Render

The repo includes a [`render.yaml`](./render.yaml) Blueprint that provisions the
full stack (PostgreSQL + Dockerized backend + Dockerized frontend). In the Render
dashboard: **New → Blueprint → select this repo → Apply**. `DATABASE_URL` and
`JWT_SECRET` are wired automatically; the frontend's nginx reverse-proxies `/api`
to the backend over Render's private network, so the app is same-origin. After
the first deploy, open the frontend URL and create an account via **Create one**
on the login screen.

---

## Quick start — Docker (recommended)

The only prerequisite is Docker. One command builds and runs Postgres + API + UI:

```bash
docker compose up --build
```

- **Frontend:** http://localhost:8080
- **API:** http://localhost:4000/api/v1
- **Postgres:** localhost:5432 (`postgres` / `postgres`, db `product_db`)

The backend applies database migrations automatically on startup. To also seed a
default admin + sample data on the first run, set `SEED_ON_START: "true"` in
`docker-compose.yml`, or seed manually (see below). Default credentials after seeding:

```
email:    admin@example.com
password: Admin@123
```

---

## Quick start — local development

Run the two apps separately with hot reload.

### 1. Database

Use Docker just for Postgres:

```bash
docker run --name pms-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=product_db -p 5432:5432 -d postgres:16-alpine
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # adjust DATABASE_URL / JWT_SECRET if needed
npm install
npm run prisma:generate       # generate the Prisma client
npm run prisma:migrate         # apply migrations (dev)
npm run prisma:seed            # optional: admin user + sample data
npm run dev                    # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm start                      # http://localhost:4200 (calls the API at :4000, CORS-enabled)
```

---

## Feature highlights

- **Authentication** — register/login, bcrypt-hashed passwords, JWT bearer tokens, a reusable auth guard middleware, and correct status codes (401/403).
- **CRUD** for Users, Categories, Products with validation and consistent error responses.
- **Product list API** — true server-side `?page=&limit=&sortBy=&order=&search=&categoryId=` returning `{ total, page, limit, totalPages, data }`.
- **Bulk import** (`POST /products/import`) — streams CSV/XLSX row-by-row, inserts in batches, tolerates bad rows, and returns a summary. **Does not time out**, because the file is processed as a stream with batched inserts and backpressure instead of being loaded into memory.
- **Report export** (`GET /reports/products`) — streams CSV/XLSX with keyset pagination straight to the response. Constant memory, no 504s.
- **Cross-cutting** — centralised error handling, Winston logging, Helmet, CORS, gzip, rate limiting, health probes, soft deletes.

---

## API overview (base: `/api/v1`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Create account, returns JWT | – |
| POST | `/auth/login` | Login, returns JWT | – |
| GET  | `/auth/me` | Current user | ✔ |
| GET/POST | `/users` `/users/:id` (GET/PUT/DELETE) | User CRUD | ✔ |
| GET/POST | `/categories` `/categories/:id` (GET/PUT/DELETE) | Category CRUD | ✔ |
| GET | `/products` | List (page/limit/sortBy/order/search/categoryId/minPrice/maxPrice) | ✔ |
| GET/POST/PUT/DELETE | `/products` `/products/:id` | Product CRUD (multipart image) | ✔ |
| POST | `/products/import` | Bulk import CSV/XLSX | ✔ |
| GET | `/reports/products?format=csv\|xlsx` | Streamed report download | ✔ |
| GET | `/health/live` · `/health/ready` | Liveness / readiness | – |

Import the Postman collection from [`postman/`](./postman) — the Login request stores the JWT automatically for every other call.

---

## Testing

```bash
cd backend && npm test        # Vitest unit tests (services, utils) — no DB needed
```

The service tests use in-memory fake repositories to demonstrate the dependency-inversion design (fast, deterministic, DB-free).

---

## Documentation

- [backend/README.md](./backend/README.md) — backend details, scripts, folder structure.
- [frontend/README.md](./frontend/README.md) — frontend details and structure.
