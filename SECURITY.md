# Security Policy

## Reporting a vulnerability

Please do **not** open a public issue for a security problem. Use GitHub's
[private security advisory](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
form on this repository, or email the maintainers listed in
[.github/CODEOWNERS](.github/CODEOWNERS).

Include:

- what an attacker can do, and under which conditions;
- the smallest reproduction you have (request, payload, account role);
- the commit you tested against;
- whether the issue is already public anywhere.

You can expect an acknowledgement within three working days and an assessment
(status, severity, planned fix) within ten.

## Supported versions

Only the default branch (`main`) is supported. Fixes are released there and
back-ported at the maintainers' discretion.

## What is in scope

- the Express API in `backend/` (authentication, authorisation, input handling,
  file uploads, rate limiting, CORS);
- secret handling in the repository and in the deployment configuration;
- the React apps where a flaw is caused by the application rather than the
  browser.

## Practice we already follow

| Control                | Where it lives                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------- |
| Secret scanning        | `.env` files are git-ignored; only `.env.example` placeholders                         |
| Dependency updates     | `.github/dependabot.yml` opens weekly PRs per package                                  |
| Dependency audit       | `npm audit --audit-level=high` plus the root multi-workspace audit in CI               |
| IaC policy scan        | tfsec HIGH/CRITICAL gate in `.github/workflows/ci.yml` and the Terraform plan workflow |
| Least-privilege CI     | `permissions: contents: read` in `.github/workflows/ci.yml`                            |
| Password storage       | one bcryptjs implementation at cost 10 (`backend/utils/password.js`)                   |
| Brute-force protection | `backend/middleware/rateLimit.js` on credential endpoints                              |
| Origin control         | Exact-match CORS allow-list in `backend/config/cors.js`                                |
| Error hygiene          | One error envelope, no stacks or driver messages to clients                            |
| Seeding                | Disabled unless `SEED_ENABLED=true` is set deliberately                                |

## Known gaps

Deliberately left open, listed here so a reviewer finds them without auditing
the code. Each one has a mitigation or a decided rationale; none is silent.

| Gap                                                         | Why it is acceptable today                                                                                            | The fix, when it matters                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Seeding endpoints create accounts with known passwords      | They exist only when `SEED_ENABLED=true`, are absent from the route table otherwise, and are documented as local-only | Keep them off in production; seed from `backend/scripts/` instead                         |
| Access tokens are valid for `JWT_EXPIRES_IN` (default `7d`) | One token per session keeps the clients simple; there is no refresh endpoint or revocation list                       | Shorten the TTL and add refresh rotation + a token version — ADR 0006 tracks the decision |
| Request validation covers tour and company write endpoints  | Other resources still rely on Mongoose schema validation, which rejects unknown types but not extra fields            | Add a validator per remaining resource under `backend/validators/`                        |
| Uploads fall back to local disk when Cloudinary is unset    | Type allow-list and a 5 MB cap apply either way; the files are served from `/uploads`                                 | Configure Cloudinary in production; see the upload-sink note in docs/security.md          |
| No `/metrics` endpoint                                      | The platform's own metrics cover the deployment; an unauthenticated scrape surface is a cost with no current consumer | Add `prom-client` behind a `METRICS_TOKEN` if a dashboard needs it                        |
| `localhost` origins are allowed when not in production      | A developer's browser app talks to a local API; production builds use `FRONTEND_URL`/`ADMIN_URL`/`COMPANY_URL`        | Keep `config/cors.js` exact-match; no wildcard has ever been accepted                     |

Details and rationale: [docs/security.md](docs/security.md).
