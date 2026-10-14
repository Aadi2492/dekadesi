# Phase 5 — Category and product API foundation

This phase adds a public category endpoint, guarded admin product CRUD, and a seed script for the DEkadesi category list. It is a development foundation, not a deployed or security-audited production store.

## New endpoints

- `GET /api/categories` — active categories for storefront filters.
- `GET /api/products` — active products (existing endpoint).
- `GET /api/products/:slug` — active product detail (existing endpoint).
- `GET /api/admin/products` — list products including category, variants and assets.
- `POST /api/admin/products` — create a draft product and first variant.
- `PATCH /api/admin/products/:id` — edit product and its first variant.
- `DELETE /api/admin/products/:id` — archive product instead of hard deleting it.

Admin routes currently use `x-admin-api-key` as an interim development guard. This is not a replacement for user accounts, secure sessions, role-based authorization, rate limiting, or a secrets manager. Do not expose the admin key in browser JavaScript or ship this API publicly with a shared key.

## Category list seeded

Ghee, Oil, Dry Fruits, Millets, Rava, Snacks, Dal, Flour, Rice, Sweetner, Combos.

## Run locally

1. Install Node.js 20+ and Docker Desktop.
2. Extract this folder and open a terminal inside it.
3. Run `docker compose up -d`.
4. Run `npm install`.
5. Copy `apps/api/.env.example` to `apps/api/.env` and set a long random `ADMIN_API_KEY`.
6. Run `npm run db:generate`.
7. Run `npm run db:migrate` and follow the Prisma prompt to name the migration (for example `initial`).
8. Run `npm run db:seed`.
9. Run `npm run dev`.
10. Check `http://localhost:4000/api/health` and `http://localhost:4000/api/categories`.

The Next.js storefront and admin UI are not yet connected to these new API routes in this phase. The API foundation must be smoke-tested locally after dependencies are installed and before any deployment. No live credentials are included.

## Phase 5.1 — storefront + admin API connection

The Next.js storefront now requests `GET /api/products` and uses the API's published product list, including the first active variant's price/label and the first product image. If the API cannot be reached, it clearly falls back to four preview products; the page labels this as preview mode. The public product feed is cached for 60 seconds.

A starter product dashboard is available at `/admin`. It lists products and supports create, edit, and archive through the API. Its Next.js route handler proxies admin requests and attaches `ADMIN_API_KEY` server-side, so the secret is not bundled into browser JavaScript. Set the same strong random key in the API's server environment and storefront's server environment. Do not commit real secrets to Git.

Storefront environment:
- `NEXT_PUBLIC_API_URL=http://localhost:4000/api` — public read-only API URL.
- `API_URL=http://localhost:4000/api` — server-side API URL used by the admin proxy.
- `ADMIN_API_KEY=...` — server-only secret; no `NEXT_PUBLIC_` prefix.

This is an integration foundation, not production-ready authentication. Before launch, replace the shared API-key guard with staff login/session authentication, role-based access control, CSRF protection as appropriate, rate limits and audit logging. Product images must use trusted HTTPS URLs. Real checkout, payment confirmation/webhooks, order processing, delivery and customer support still require end-to-end integration and testing.
