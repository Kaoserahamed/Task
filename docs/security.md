# Security

See also [SECURITY.md](../SECURITY.md) for how to report a vulnerability.

## Authentication and authorisation

- **Customers / companies:** `POST /user/auth/login` and
  `POST /company/auth/login` return a JWT signed with `JWT_SECRET`
  (`JWT_EXPIRES_IN`, default `7d`). Protected routes require
  `Authorization: Bearer <token>`.
- **Admins:** `/api/admin/*` is mounted twice on purpose — the public part
  (login, forgot-password) and the guarded part (`middleware/adminAuth.js`).
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
  reads a variable that `backend/.env.example` does not document.
- Demo credentials (`DEMO_*_PASSWORD`) have no defaults: the seed scripts and
  routes error out until they are set.

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

## What to do about a leaked secret

1. Rotate it in the provider (Mongo user, Cloudinary key, JWT secret) — assume
   it is compromised the moment it is pushed.
2. Purge it from history (`git filter-repo`) and force-push after coordinating
   with the team; a deleted commit is still readable in clones and forks.
3. Add the variable to `.env.example` if it was missing, so the next person does
   not repeat the mistake.
4. Rotating `JWT_SECRET` invalidates every session: schedule it with users.
