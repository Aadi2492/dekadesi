# Implementation plan
- Phase 1 (included): monorepo, storefront starter, API health endpoint, Prisma schema, Docker PostgreSQL/Redis, env templates.
- Phase 2: secure admin login/RBAC, product/category/variant CRUD, image upload to Cloudflare R2, inventory audit trail.
- Phase 3 (included in this package): checkout API, server-priced order creation, transactional stock reservation, COD, Razorpay order/signature/webhook verification, refund API protected by ADMIN_API_KEY. Frontend cart/checkout UI wiring remains to be completed.
- Phase 4: delivery, CRM, coupons, suppliers, reports, imports/exports, notifications, tests, CI and deployment hardening.
Never trust client-supplied prices or payment state. Keep secrets server-side. Store INR amounts as integer paise.

- Phase 4: operations, shipping, suppliers, coupons, support tickets, reports, CSV export, notification queue; production integration/testing still required.
