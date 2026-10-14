# DEkadesi Phase 4 — Operations, CRM & Reporting

## What this phase adds
- Shipment records and carrier/tracking metadata.
- Supplier directory endpoints.
- Coupon creation/listing with PERCENT or FIXED discount types.
- Customer support ticket creation, triage and resolution fields.
- Operations summary report and CSV-formatted order export payload.
- In-app notification queue records (delivery provider integration is not included).
- Admin API key guard for admin-only Phase 4 endpoints.

## API routes
All routes are under `/api`. Admin routes require `x-admin-api-key` matching `ADMIN_API_KEY`. Support ticket creation is public by design for customer intake; rate limiting and spam protection must be configured before public launch.

| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/admin/shipments` | List/create shipments |
| PATCH | `/api/admin/shipments/:id` | Update tracking/status |
| GET/POST | `/api/admin/suppliers` | List/create suppliers |
| PATCH | `/api/admin/suppliers/:id` | Update supplier |
| GET/POST | `/api/admin/coupons` | List/create coupons |
| POST | `/api/admin/support-tickets` | Customer support intake |
| GET/PATCH | `/api/admin/support-tickets` and `/:id` | Admin ticket list/update |
| GET | `/api/admin/reports/summary` | Aggregated operational snapshot |
| GET | `/api/admin/reports/orders.csv` | CSV export as JSON payload containing CSV text |
| GET/POST | `/api/admin/notifications` | List/queue in-app notification records |

## Setup on Windows
1. From repository root, copy `apps/api/.env.example` to `apps/api/.env`.
2. Set `DATABASE_URL`, Razorpay credentials only if using payment features, and a strong random `ADMIN_API_KEY`. Never commit `.env`.
3. Install dependencies at the repository root with `npm install`.
4. Generate Prisma client: `npm run db:generate`.
5. Apply database schema: `npm run db:migrate` (for a new development database, Prisma may prompt for a migration name).
6. Start API: `npm run dev --workspace @dekadesi/api`.

## Smoke-test examples
Replace `localhost:4000` with the deployed API base URL.

```bash
curl -H "x-admin-api-key: YOUR_ADMIN_API_KEY" http://localhost:4000/api/admin/reports/summary
curl -H "x-admin-api-key: YOUR_ADMIN_API_KEY" http://localhost:4000/api/admin/shipments
curl -X POST -H "Content-Type: application/json" -H "x-admin-api-key: YOUR_ADMIN_API_KEY" -d '{"name":"Local Organic Supplier","phone":"+91-0000000000"}' http://localhost:4000/api/admin/suppliers
```

## Phase 4 boundaries and production checklist
- Admin UI is still not wired to these API endpoints; dashboard sample data remains local/demo state.
- Notifications are queued in the database only; no email/SMS/WhatsApp provider sends messages.
- CSV export currently returns a JSON object with CSV text; a streaming download endpoint should replace this for large exports.
- Supplier, coupon and shipment routes need end-to-end tests and role-scoped permissions before production. Admin API key is a bootstrap protection, not a replacement for user login, MFA, per-role authorization and key rotation.
- Public support intake needs rate limiting, CAPTCHA or equivalent abuse controls and privacy review.
- Validate migrations against a disposable database before production.
- Add a real courier integration, coupon redemption in checkout, inventory purchase orders, scheduled backups, restore drills, alerting and integration tests before launch.
- Do not treat sample data or reports as accounting truth until payments/refunds are reconciled.

## Phase plan
Phase 4 extends the Phase 3 source tree. It is a development milestone, not a claim that the whole commerce platform is production-ready.
