# Frontend — Product Management UI

Angular 20 (standalone APIs + Signals) with Angular Material. See the root [ARCHITECTURE.md](../ARCHITECTURE.md) for design reasoning.

## Prerequisites

- Node.js ≥ 20
- The backend API running (default `http://localhost:4000`)

## Setup

```bash
npm install
npm start            # dev server at http://localhost:4200
```

The API base URL lives in `src/environments/environment.ts` (development) and
`src/environments/environment.prod.ts` (production, same-origin via nginx). The
interface is defined once in `environment.model.ts`.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Dev server (`ng serve`) at :4200 |
| `npm run build` | Production build → `dist/frontend/browser` |
| `npm test` | Unit tests (Karma/Jasmine) |

## Folder structure

```
src/app/
├── app.ts / app.config.ts / app.routes.ts    # root shell, providers, routes
├── core/
│   ├── models/           # typed API contracts (mirror the backend envelope)
│   ├── services/         # AuthService, UserService, CategoryService,
│   │                     #   ProductService, ReportService, UploadService,
│   │                     #   NotificationService, LoadingService
│   ├── interceptors/     # jwt, error, loading (functional interceptors)
│   └── guards/           # authGuard, guestGuard (functional guards)
├── shared/
│   ├── components/confirm-dialog/    # reusable confirmation dialog
│   └── services/confirm.service.ts
└── features/
    ├── layout/           # authenticated shell (navbar + responsive sidebar)
    ├── auth/             # login / register
    ├── dashboard/        # stat cards + skeleton loaders
    ├── products/         # server-side table + create/edit dialog (image upload)
    ├── categories/       # list + dialog
    ├── users/            # list + dialog
    ├── bulk-upload/      # streamed import + progress + summary
    └── reports/          # streamed CSV/XLSX download
```

## Key patterns

- **Signals** for session + global loading state; **RxJS** for HTTP (debounced, cancellable search via `switchMap`).
- **Interceptors** attach the JWT, show a global loading bar, and centralise error toasts + auto-logout on 401.
- **Reactive Forms** with validators mirroring the backend rules.
- **Lazy-loaded** feature routes for small initial bundles.
- Angular Material 20.2+ uses native CSS animations, so the deprecated `@angular/animations` provider is intentionally not used.
