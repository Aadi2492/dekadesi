# DEkadesi Phase 5.2 — Storefront checkout integration

This phase adds a client-side basket and delivery form to the Next.js storefront, server-side Next.js proxy routes for checkout/payment verification, COD order submission, and a Razorpay Checkout.js path. The API remains the source of truth for prices, totals, shipping threshold, availability and stock reservation.

## Routes added
- `POST /api/checkout` (Next.js proxy to API `POST /api/checkout`)
- `POST /api/payments/verify` (Next.js proxy to API `POST /api/payments/verify`)

## Local setup
1. Copy `apps/api/.env.example` to `apps/api/.env` and configure `DATABASE_URL`, `ADMIN_API_KEY`, and (only for online payments) Razorpay test credentials.
2. Copy `apps/storefront/.env.example` to `apps/storefront/.env.local`. Set `API_URL=http://localhost:4000/api` and a matching `ADMIN_API_KEY`.
3. Start PostgreSQL/Redis with `docker compose up -d` from the project root.
4. From project root run `npm install`, then `npm run db:generate`, `npm run db:migrate --workspace @dekadesi/api`, and `npm run db:seed --workspace @dekadesi/api` if seed data is desired.
5. Add at least one ACTIVE product with an ACTIVE variant and stock using `/admin` (server and database must be running).
6. Run `npm run dev` from project root. Storefront: `http://localhost:3000`; API health: `http://localhost:4000/api/health`.

## Checkout behaviour
- The basket only accepts products that have a database-backed variant ID. Preview fallback products cannot be ordered.
- COD creates an order through the API. Online checkout requires Razorpay credentials and a configured webhook in the Razorpay dashboard.
- Server API recomputes price/shipping and reserves stock; client-calculated totals are display-only.
- Razorpay signature verification is proxied server-side. The webhook endpoint must be configured to the public API URL `/api/payments/webhook` with the same webhook secret.

## Before production
This is a development integration, not a production certification. Configure GST/tax rules, shipping coverage and carrier rates, rate limiting, CSRF/abuse protections, customer privacy/retention, staff authentication and role-based access, order confirmation emails/SMS, payment webhook monitoring, refunds, backups, HTTPS and end-to-end tests. COD currently marks order status as confirmed while payment status remains pending. Verify policies with the business/accountant before accepting real orders. Never commit `.env` or real credentials.
