# DEkadesi Phase 5.3 — Order Management

This phase adds an admin order-management API and a storefront admin screen.

## What's included
- `GET /api/admin/orders` lists the latest 200 orders, with optional `status` and `q` filters.
- `PATCH /api/admin/orders/:orderId/status` updates order status and writes an audit-log entry.
- API endpoints require `x-admin-api-key` via `AdminKeyGuard`.
- Next.js server-side routes proxy requests and keep `ADMIN_API_KEY` off the browser.
- Admin UI at `/admin/orders` shows order totals, customer contact/address, items, payment status and latest shipment info.
- Product dashboard now links to order management.

## Configuration
Set the same strong `ADMIN_API_KEY` in the API server and storefront server environment. Configure `API_URL` for the storefront (for example `http://localhost:4000/api`). Keep secrets server-only; do not prefix them with `NEXT_PUBLIC_`.

## Important limitations
- This is a starter admin gate using a shared API key, not staff login/roles. Add individual accounts, RBAC, CSRF protections as appropriate, rate limits, and secret rotation before production.
- Changing an order's status does not ship a parcel, collect payment, or issue a refund. Refunds must use the payment provider workflow; shipments should be managed through the shipment module.
- Order list is capped at 200; pagination can be added for larger stores.
- Build, database-connected testing, and full end-to-end checkout/payment testing have not been completed in this environment. Configure the database and run Prisma migrations before testing.
