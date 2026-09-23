# Changelog

All notable changes to this project are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Layered backend: `app.js` factory, `validators/`, `services/` and
  `repositories/` for the tour domain, plus a typed error taxonomy
  (`utils/errors.js`) and one central error handler.
- Security middleware: `helmet`, an exact-match CORS allow-list shared by HTTP
  and Socket.IO, and rate limiting on credential and upload endpoints.
- Observability: structured JSON logging via pino, per-request ids, and
  `/health/live` + `/health/ready` probes.
- Testing: hermetic `backend/tests/unit` suite (no database), opt-in
  `backend/tests/integration` suite against a real MongoDB, a coverage gate
  (`backend/scripts/check-coverage.js`) and drift-guard contract tests.
- Tooling: ESLint/Prettier for every stack, `npm run verify`, a repository guard
  (`scripts/verify-repo.mjs`) and Dependabot configuration.
- Documentation tree under `docs/` with an index, architecture, API, security,
  operations, testing and CI guides, plus architecture decision records.
- Container support: `docker-compose.test.yml` for integration work.
- Onboarding and delivery: a dev container (`.devcontainer/`), a pull request
  template, CODEOWNERS entries for the new paths, and a Dependabot `docker`
  ecosystem entry for the API base image.
- Database evolution: numbered migrations applied by
  `backend/scripts/run-migrations.js`, with a `_migrations` ledger, a documented
  format and `docs/migrations.md`.
- The gaps that are deliberately left open (token lifetime, validation coverage,
  upload fallback, metrics, `schemaVersion`) are listed in `SECURITY.md` and
  `docs/security.md` instead of being left for a reviewer to discover.

### Changed

- The Express application is no longer built as a side effect of starting the
  server, which makes every route exercisable by `supertest` without a port.
- Seat booking is a single guarded update, so concurrent buyers cannot oversell
  a tour.
- Demo account passwords are read from `DEMO_*_PASSWORD` environment variables;
  no credential is committed.
- `/api/tours` mutations are declared in `routes/tours.js` next to the reads
  rather than inline in the entry point.
- The API image runs as the unprivileged `node` user with a `HEALTHCHECK` on
  `/health/live`, installs locked production dependencies only, and builds from a
  context that excludes tests, coverage, secrets and data.
- The front-end CSS notes moved out of `frontend/` into the docs tree; the
  documentation index links every page.

### Fixed

- The error handler was mounted before several routers, so errors raised by
  those routes bypassed it.
- Malformed multipart JSON in tour payloads returned a 500 instead of a typed 400.
- `origin.includes('vercel.app')` accepted attacker-controlled origins such as
  `evil-vercel.app.attacker.example`.
- The three React apps set `CI` with a POSIX-only `CI=… command` prefix, so
  `npm test` and `npm run build` failed in `cmd.exe`; the scripts now use the
  `cross-env` already installed in each app, and `verify:repo` rejects a script
  that starts with an inline environment assignment.

### Security

- Seeding endpoints (`/api/seed-tours`, `/api/demo/create-accounts`) now require
  `SEED_ENABLED=true` and are absent by default.
- Runtime uploads, build output and binaries are no longer tracked.
- The duplicate native `bcrypt` dependency is removed: all hashing goes through
  `utils/password.js` on `bcryptjs` at cost 10. Password-reset endpoints no
  longer log the new password or the reset token, and admin passwords hashed at
  cost 12 are now written at the documented cost.

## [1.0.0] - Initial import

The original coursework application: an Express + MongoDB API with four React
clients (customer, admin, tour company, recommendations).
