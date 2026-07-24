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

# Config is a TEMPLATE: the nginx image runs envsubst on /etc/nginx/templates/*.template
# at startup, injecting ${PORT} and ${BACKEND_ORIGIN}. Defaults below work for
# local docker-compose; Render overrides both (PORT automatically, BACKEND_ORIGIN
# via the blueprint's fromService reference to the backend's private address).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV PORT=80
ENV BACKEND_ORIGIN=backend:4000

EXPOSE 80
# The base image's entrypoint renders the template, then runs this CMD.
CMD ["nginx", "-g", "daemon off;"]
