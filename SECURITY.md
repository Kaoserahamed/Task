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

| Control                | Where it lives                                                       |
| ---------------------- | -------------------------------------------------------------------- |
| Secret scanning        | `.env` files are git-ignored; only `.env.example` placeholders       |
| Dependency updates     | `.github/dependabot.yml` opens weekly PRs per package                |
| Dependency audit       | `npm audit --audit-level=high` in CI                                 |
| Least-privilege CI     | `permissions: contents: read` in `.github/workflows/ci.yml`          |
| Password storage       | one bcryptjs implementation at cost 10 (`backend/utils/password.js`) |
| Brute-force protection | `backend/middleware/rateLimit.js` on credential endpoints            |
| Origin control         | Exact-match CORS allow-list in `backend/config/cors.js`              |
| Error hygiene          | One error envelope, no stacks or driver messages to clients          |
| Seeding                | Disabled unless `SEED_ENABLED=true` is set deliberately              |

Details and rationale: [docs/security.md](docs/security.md).
