# Apna Mart POS - Security Documentation (Phase 9)

## Authentication & Authorization
- **Passwords**: Hashed securely using bcrypt. Never stored or logged in plaintext.
- **Sessions**: Uses HTTP-only, secure cookies with JWT for session management.
- **RBAC**: Enforced server-side. 
  - ADMIN role is required for inventory adjustments, product pricing, user management, and settings.
  - CASHIER role is restricted to POS operations and viewing history.

## Database & Data Integrity
- **Concurrency**: PostgreSQL row-level locks prevent race conditions during checkout and manual stock adjustments. Stock can never become negative.
- **Orders**: Orders are immutable once completed. Payment status is backend-controlled.
- **Idempotency**: Checkouts require an idempotency key to prevent double submissions.
- **Integrity Checks**: Admins can run data integrity checks from the settings page to verify stock and order correctness without silently modifying data.

## API Security
- **Rate Limiting**: Login endpoint is limited to 10 requests per 15 minutes to prevent brute-force attacks. API endpoints are limited to 1000 requests per 15 minutes.
- **Headers**: Helmet is used to set standard HTTP security headers.
- **CORS**: Restricted to the frontend origin only.
- **Payload Limits**: JSON request bodies are limited to 10MB to prevent DOS attacks.
- **Validation**: Pagination limits are strictly enforced server-side.

## Audit Logs
- All sensitive operations generate immutable audit logs.
- Audit logs are accessible only by ADMIN users via the frontend /audit-logs dashboard.

## Backup & Restore
- Backups are created locally in the Backups directory using pg_dump.
- Administrators can trigger backups and view their status from the Settings page.
- Database restoration uses pg_restore and includes a severe warning. It overwrites existing data and requires an exact filename.

## Offline Capabilities
- The POS operates entirely locally. External APIs are not required for core operations. 
- Payment confirmation for QR/UPI is manual to avoid relying on external network dependencies.
