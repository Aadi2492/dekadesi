# Phase 3 — Checkout, orders and payments

## Implemented API routes

All routes are under `/api`.

- `POST /checkout` — validates checkout payload, fetches prices from PostgreSQL (never trusts client prices), computes shipping, atomically reserves inventory and creates order items.
- `GET /orders/:orderNumber` — fetches an order summary by high-entropy order number.
- `POST /payments/verify` — verifies Razorpay checkout signature with HMAC-SHA256 and marks payment/order paid.
- `POST /payments/webhook` — validates `X-Razorpay-Signature` against the raw request body and handles captured/paid/failed payment events.
- `POST /admin/orders/:orderId/refund` — calls Razorpay refund API and records refund/audit data. Requires `x-admin-api-key` matching `ADMIN_API_KEY`.

## Checkout body example

```json
{
  "items": [{ "variantId": "DATABASE_VARIANT_ID", "quantity": 2 }],
  "shippingAddress": {
    "fullName": "Customer Name", "phone": "+919876543210",
    "line1": "House / Street", "city": "Jaipur", "state": "Rajasthan",
    "postalCode": "302017", "country": "IN"
  },
  "customerEmail": "customer@example.com",
  "paymentMethod": "RAZORPAY"
}
```

For COD, set `paymentMethod` to `COD`. Amounts are integer paise; ₹499 is `49900` paise. Current default shipping is ₹49 below ₹999 and free at/above ₹999. This is an example business rule and should be confirmed before launch.

## Setup

1. Copy `apps/api/.env.example` to `apps/api/.env` and set `DATABASE_URL`.
2. Set Razorpay test keys in `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; set `RAZORPAY_WEBHOOK_SECRET` to the secret configured in the Razorpay dashboard.
3. Set a long random `ADMIN_API_KEY` for the temporary refund route protection.
4. From the repository root, run `npm install`, `npm run db:generate`, then `npm run db:migrate`.
5. Configure the Razorpay webhook URL as `https://YOUR_API_HOST/api/payments/webhook`, subscribing to `payment.captured`, `payment.failed`, and `order.paid`.

## Important production gaps

- Admin refund protection currently uses a shared API key only as a temporary gate. Replace with authenticated JWT/session + role-based authorization before public production deployment.
- Customer order lookup currently relies on an unguessable order number; production should additionally require an order access token or authenticated ownership check.
- GST/tax calculations are deliberately not guessed: `taxPaise` is currently zero. Implement configured product tax rates, place-of-supply rules and invoice compliance before taking taxable orders.
- Add idempotency records for webhooks/refunds, payment reconciliation, rate limits, structured logging and integration tests before production.
- The Razorpay frontend checkout widget and storefront cart UI are not wired in this phase; this package provides the API contracts.
- Stock is reserved at order creation. A scheduled expiry/release policy for abandoned Razorpay orders is still required.
- Refund reconciliation needs a production-safe handling policy for multiple partial refunds and provider webhook reconciliation.
