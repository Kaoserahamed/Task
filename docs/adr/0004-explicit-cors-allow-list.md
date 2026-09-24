# ADR 0004 — CORS is an exact allow-list, not a substring match

- **Status:** Accepted
- **Date:** 2026-09-23

## Context

The API accepted any request whose `Origin` merely _contained_ a trusted string:

```js
if (origin.includes('.vercel.app') || origin.includes('vercel.app')) return callback(null, true);
if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
```

with `credentials: true`. An attacker who registers
`evil-vercel.app.attacker.example` (or `localhost.evil.example`) gets a
reflected `Access-Control-Allow-Origin` for the compromised origin and can then
read authenticated responses. The same logic was duplicated in `socket.js` for
WebSockets, so a fix in one place would have left the other open.

## Decision

`backend/config/cors.js` is the single source of truth:

- origins come from `FRONTEND_URL`, `ADMIN_URL`, `COMPANY_URL` and
  `CORS_EXTRA_ORIGINS` (comma separated), matched **exactly** after stripping a
  trailing slash;
- loopback origins (`http://localhost:<any port>`, `127.0.0.1`, `[::1]`) are
  accepted only when `NODE_ENV !== 'production'`, so local development keeps
  working without weakening production;
- requests without an `Origin` header are allowed — CORS is a browser control,
  and curl/server-to-server traffic is not what it protects;
- a rejected origin produces a typed `ForbiddenError` (`CORS_BLOCKED`) so the
  refusal is visible in the same error envelope as everything else;
- `socket.js` consumes the same validator, so HTTP and WebSocket share one
  policy.

## Consequences

- Deploying a new front-end URL requires setting an environment variable; that
  is the intended friction, and it is documented in `backend/.env.example`.
- Preview deployments need `CORS_EXTRA_ORIGINS` rather than a wildcard.
- `cors` still answers preflights for allowed origins with `204` and caches them
  for a day (`maxAge`).

## Alternatives considered

- **`origin: true` (reflect anything)** — simplest and worst; with credentials
  it is equivalent to no protection at all.
- **Regex on the hostname suffix** — closer to correct than `includes`, but
  "ends with `.vercel.app`" still trusts every Vercel customer. Only explicit
  entries can be audited.
