# ─────────────────────────────────────────────────────────────────────────────
# Frontend Dockerfile — build the Angular app, serve the static bundle with nginx.
#
# WHY nginx (not `ng serve`): `ng serve` is a dev server, unsuitable for prod.
# We compile an optimised static bundle and let nginx serve it — fast, tiny, and
# it also reverse-proxies /api and /uploads to the backend (so the browser makes
# same-origin calls and there is no CORS in production).
# ─────────────────────────────────────────────────────────────────────────────

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build   # produces dist/frontend/browser (production config)

# ---- Runtime stage ----
FROM nginx:1.27-alpine AS runtime
# Angular's application builder emits the SPA into dist/frontend/browser.
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
