# Security

See also [SECURITY.md](../SECURITY.md) for how to report a vulnerability.

## Authentication and authorisation

- **Customers / companies:** `POST /user/auth/login` and
  `POST /company/auth/login` return a JWT signed with `JWT_SECRET`
  (`JWT_EXPIRES_IN`, default `7d`). Protected routes require
  `Authorization: Bearer <token>`.
- **Admins:** `/api/admin/*` is mounted once. The router keeps login public and
  applies `middleware/adminAuth.js` to every administrative mutation. The
  production signup route is disabled; administrators are provisioned by an
  operator or controlled seed process.
- **Passwords** are stored as bcrypt hashes produced by one module,
  `backend/utils/password.js` (`bcryptjs`, cost 10). The native `bcrypt` package
  that used to serve the company endpoints is gone, so every hash in the
  database was written by the same algorithm and cost, and every verification
  goes through the same comparison helper. No password ever appears in a
  response or a log line — including the password-reset endpoints, which used to
  log the new password and the reset token.
- Any new route that touches user data must add the corresponding middleware
  before it ships; the guarded mount is a deliberate second layer.

## Secrets

- Every secret lives in an environment variable, never in the repository.
  `.gitignore` blocks `*.env` and `*.env.*` and only allows `.env.example`
  placeholders.
- The backend refuses to start without `MONGODB_URI` and `JWT_SECRET`
  (`config/env.js`), so a misconfigured deployment fails immediately instead of
  at the first request. Under `NODE_ENV=test` it records the gap in
  `config.validation.missing` rather than exiting.
- `backend/tests/unit/contracts/env-template.test.js` fails the build if the code
  reads a variable that `backend/.env.example` does not document. The root
  `.env.example` mirrors the complete backend contract and is the fresh-clone
  index; the app-local templates remain the source each process loads.
- Demo credentials (`DEMO_*_PASSWORD`) have no defaults: the seed scripts and
  routes error out until they are set.

### Environment classification

| Class                       | Variables                                                                                                                                                                                        | Handling                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Secrets                     | `JWT_SECRET`, `MONGODB_URI`, `REDIS_URL`, `CLOUDINARY_API_SECRET`, `PUSHER_SECRET`, `METRICS_TOKEN`, `SENDINBLUE_API_KEY`, `WEATHER_API_KEY`                                                     | Store in a secret manager or untracked `.env`; never commit or print values. ECS uses IAM role credentials rather than static AWS keys. |
| Credentials                 | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_CLUSTER`                                                                                                   | Treat as provider configuration; use placeholders locally and rotate through the provider.                                              |
| Non-sensitive configuration | `PORT`, `NODE_ENV`, `JSON_BODY_LIMIT`, `LOG_LEVEL`, HTTP/S3/Redis/idempotency timeouts, `FRONTEND_URL`, `ADMIN_URL`, `COMPANY_URL`, `CORS_EXTRA_ORIGINS`, `AWS_REGION`, `S3_BUCKET`, `S3_PREFIX` | Safe to configure per environment, but validate values and do not expose admin-only settings publicly.                                  |
| Demo-only                   | `DEMO_*_EMAIL`, `DEMO_*_PASSWORD`, `SEED_ENABLED`                                                                                                                                                | Keep disabled in production; replace values before enabling any seed route or script.                                                   |

The authoritative placeholders are in the root
[`.env.example`](../.env.example) and app-local `backend/.env.example`.

## Seeding and demo data

`/api/seed-tours` and `/api/demo/create-accounts` create accounts with known
passwords. They are mounted **only** when `SEED_ENABLED=true` and are absent
from the route table otherwise (a request gets the ordinary 404). Never enable
the flag on a deployment that anyone else can reach.

## CORS

`config/cors.js` holds an exact-match allow-list built from `FRONTEND_URL`,
`ADMIN_URL`, `COMPANY_URL` and `CORS_EXTRA_ORIGINS`. Loopback origins are
accepted only outside production, and the same validator is used for Socket.IO.
Rationale: [adr/0004-explicit-cors-allow-list.md](adr/0004-explicit-cors-allow-list.md).

## Rate limiting and request size

| Scope                         | Limit                  | Where                     |
| ----------------------------- | ---------------------- | ------------------------- |
| `/user/auth`, `/company/auth` | 30 / 15 min            | `middleware/rateLimit.js` |
| everything under `/api`       | 600 / 15 min           | `middleware/rateLimit.js` |
| tour image uploads            | 120 / hour             | `middleware/rateLimit.js` |
| JSON body                     | 1 MB                   | `JSON_BODY_LIMIT`         |
| uploaded image                | 5 MB, image types only | `config/upload.js`        |

Exceeding a limit returns `429` with `code: 'RATE_LIMITED'`.

## Transport and headers

`helmet` sets the standard response headers; `x-powered-by` is disabled.
`trust proxy` is on, which is what makes rate limiting use the real client IP
behind Render/Railway/Vercel/nginx — set your proxy to strip inbound
`x-forwarded-for` values it does not generate.

## Open gaps and planned work

The gaps below are deliberate; they are repeated in
[SECURITY.md](../SECURITY.md#known-gaps) so an external reviewer sees them too.

- **Token lifetime.** Access tokens last `JWT_EXPIRES_IN` (default `7d`) and
  there is no refresh rotation or revocation list. Shortening the TTL is a
  one-line change; a refresh endpoint with a `jti` deny-list is the follow-up
  described in
  [ADR 0006](adr/0006-access-tokens-and-password-hashing.md).
- **Validation coverage.** `validators/` covers the tour, company, and wishlist
  write endpoints; the tour validator is the template. The wishlist owner key is
  normalized and unique per tour, with a numbered migration removing historical
  duplicates before the index is created.
- **Uploads.** Production selects private S3 when `S3_BUCKET` and AWS region
  are configured; legacy Cloudinary multipart uploads remain available when
  explicitly configured. S3 buckets are private and downloads use short-lived
  presigned redirects.
- **Metrics.** `/metrics` exposes Prometheus text metrics; set `METRICS_TOKEN`
  and restrict the path to the private monitoring path/role.
- **Migrations.** The runner and the format exist
  ([migrations.md](migrations.md)); no collection carries `schemaVersion` yet
  because no shape change has needed it.

## What to do about a leaked secret

1. Rotate it in the provider (Mongo user, Cloudinary key, JWT secret) — assume
   it is compromised the moment it is pushed.
2. Purge it from history (`git filter-repo`) and force-push after coordinating
   with the team; a deleted commit is still readable in clones and forks.
3. Add the variable to `.env.example` if it was missing, so the next person does
   not repeat the mistake.
4. Rotating `JWT_SECRET` invalidates every session: schedule it with users.
