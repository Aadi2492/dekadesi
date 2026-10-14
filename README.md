# DEkadesi Commerce Platform — Phase 5 (API foundation)
Starter monorepo: Next.js storefront, NestJS REST API, PostgreSQL/Prisma, Redis via Docker Compose.

## Run locally
1. Install Node.js 20+ and Docker Desktop.
2. Extract this ZIP, open terminal in the project folder.
3. Run `docker compose up -d`
4. Run `npm install`
5. Copy `apps/api/.env.example` to `apps/api/.env`
6. Run `npm run db:generate && npm run db:migrate`
7. Run `npm run dev`
Storefront: http://localhost:3000 | API health: http://localhost:4000/api/health

This is a Phase 1 foundation. Sample prices are illustrative. Live checkout, secure admin authentication, payment/webhook processing, R2 uploads, and production deployment are not yet implemented. Configure secrets privately and test before launch.


## Admin dashboard (Phase 2 UI)
After `npm run dev`, open http://localhost:3000/admin. See `ADMIN_DASHBOARD_GUIDE.md` for included features and limitations.

## Phase 3 checkout and payments

See [`PHASE3_CHECKOUT_PAYMENTS.md`](./PHASE3_CHECKOUT_PAYMENTS.md) for checkout/payment endpoints, setup and known production gaps. The API now contains server-priced checkout, transactional stock reservation, COD, Razorpay order/signature/webhook handling and a temporarily API-key-protected refund endpoint. Do not use live payment keys until the listed security, tax, idempotency and integration-test gaps are closed.


## Phase 4
See `PHASE4_OPERATIONS_CRM_REPORTS.md` for shipment management, suppliers, coupons, support tickets, reports, CSV export and notification queue APIs. Admin API routes require `ADMIN_API_KEY`. The admin UI is not yet wired to these endpoints.


## Phase 5 — Category and product API foundation

See [`PHASE5_API_CATEGORIES_PRODUCTS.md`](./PHASE5_API_CATEGORIES_PRODUCTS.md) for public category feed, guarded admin product CRUD, category seed, setup and limitations. The storefront/admin interface is not yet connected to these endpoints.

## Phase 5.1: Connected catalogue and starter admin
- Storefront reads published products from `GET /api/products` and falls back to sample catalogue only when API is unreachable.
- `/admin` provides product listing, create, edit, publish/draft and archive actions.
- Admin requests are proxied server-side so `ADMIN_API_KEY` is not exposed to the browser.
- Configure `apps/storefront/.env.local` using `.env.example`; configure the same `ADMIN_API_KEY` securely in the API environment.
- This is not production staff authentication; review the Phase 5 API notes before deployment.


## Phase 5.3 — Storefront checkout integration

See `PHASE5_2_CHECKOUT.md` for basket, delivery form, COD order creation, Razorpay checkout integration, local setup and production checklist. Checkout is disabled for fallback preview products; the API database must contain active product variants.


## Phase 5.3 — Order management
See `PHASE5_3_ORDER_MANAGEMENT.md` for the admin order list, search/status filters, audited status changes, and setup limitations. Admin order dashboard: `/admin/orders`.
