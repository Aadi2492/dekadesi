# DEkadesi Admin Dashboard — Phase 2 UI

## Route
Start the app as described in README, then open:
`http://localhost:3000/admin`

## Included in this phase
- Dashboard overview and sample KPI cards
- Product catalogue search, add-draft flow, publish/draft toggle, CSV export
- Orders list, fulfilment status updates, CSV export and printable order proforma preview
- Inventory stock adjustments and low-stock indicators
- Customer directory, local add-customer form and CSV export
- Support ticket list, create ticket and update status
- Marketing asset library: upload local images/PDFs, preview, rename and remove
- Creative format guide for product photos, web banners, social posters and print
- Campaign planning placeholders
- CSV import preview and product/order/customer export
- Reports from sample records
- Settings, integration readiness, role and data safety checklists
- Browser localStorage persistence for demo edits

## Important limitations
This is a browser-side prototype. It does not yet authenticate administrators or call a production API for these operations. Sample records are fictional, and sample amounts are not real transactions. Local image upload uses browser storage, not Cloudflare R2. CSV import intentionally previews but does not apply rows. Proforma printout is explicitly not a GST/tax invoice. Razorpay, refunds, delivery providers, messaging/email, permissions, audit logs and database transactions require server-side implementation before launch.

## Production build requirements
- Authentication with secure cookies, MFA option, session expiry and RBAC
- NestJS service endpoints and DTO validation for every mutation
- Prisma transactions and audit logs for order, payment and stock operations
- Razorpay signature verification and idempotent webhooks
- R2 presigned upload flow, type/size checks and private asset permissions
- Validated import pipeline with dry-run, row errors, duplicate strategy and rollback
- GST-compliant invoice fields/numbering only after business/tax details are confirmed
- Customer privacy controls, export authorization, retention and deletion workflows
- Automated tests, CI, backups, monitoring and deployment hardening
