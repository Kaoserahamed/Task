# Changelog

All notable changes to this project are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Optional, privacy-safe Sentry monitoring and root error containment in all
  three React apps, with event-reference fallback UI, retry recovery, environment
  templates, focused tests, and a cross-app architecture contract. Sentry 11's
  Node requirement is reflected in every package's `>=20.19.0` engine floor.
- Customer search filtering now delegates URL parsing, review aggregation, matching, sorting,
  and display formatting to a tested `searchFilters` utility.

- Fresh-clone verification now runs the complete root `npm run verify` path,
  including backend and all three web test suites plus every production build.
- Conventional root `npm test` and `npm run build` entry points make the
  runnable suite and deployable web artifacts visible to contributors and buyers.
- Integration tests use `mongodb-memory-server` when no database URI is supplied;
  a cold clone gets a longer one-time binary-download budget.
- A root `.env.example` indexes the app-local environment templates for onboarding.
- `MONGODB_URI_TEST`, both Places API key names and `VERCEL` are documented in the
  environment templates, and a contract test keeps every web app's `.env.example`
  in sync with the `process.env` reads inside its source.
- The tour-company edit form is now an orchestrator: the six form sections live in
  `Components/EditTour/sections/`, while API-response normalisation and the
  multipart update body moved to tested `utils/tourPayload.js`. `EditTour.jsx`
  dropped from 429 to under 200 lines.
- The review page is composed from a presentational `ReviewForm` and `ReviewCard`,
  with date formatting, completed-tour filtering, photo validation and multipart
  assembly in tested `reviewUtils.js`; `ReviewPage.jsx` dropped from 424 to 250
  lines.
- The company HTTP surface is split by concern: `routes/companyAuthRoutes.js`
  (registration, login, password reset, re-auth) and
  `routes/companySearchRoutes.js` (directory, search, profile, admin
  verification), each with its own route test. The profile allow-list lives in
  `utils/companyUpdate.js`, so approval state and the reset token can never be
  written by a profile request.
- Terraform CI now runs formatting, validation, an offline plan, and Trivy IaC policy scanning.
- Pull requests touching `infrastructure/**` get a dedicated Terraform plan, tfsec
  gate, uploaded plan artifact, and review comment.
- The Terraform remote state backend (encrypted S3 state plus DynamoDB lock, wired
  through `TF_STATE_BUCKET` / `TF_STATE_KEY` / `TF_LOCK_TABLE`) is now documented in
  `docs/ci-cd.md` and the infrastructure README, including the one-time bootstrap.
- The storefront hero styles now live in `HeroSection.css` instead of an inline
  `<style jsx>` block, with a focused render test covering the extracted component.
- Tour-company upload/edit forms now share `useTourForm` and centralized form options,
  with focused hook tests covering nested state and file updates.
- Tour-company upload/edit forms now share client-side validation and accessible inline
  status feedback instead of browser alerts.
- Tour-company dashboard metrics and chart-domain calculations now live in a pure
  tested utility, keeping the React component focused on rendering.
- Company license status normalization and PDF generation now live in tested utilities; the component is below 500 lines and no longer duplicates its company fetch/socket effects.
- Company license details now live in a tested presentational fields component; `License.jsx`
  is below 250 lines while edit, document filtering, and verification actions remain stateful.

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
- Each React app now speaks HTTP through one door: `src/api/` holds the shared
  client (bearer token, JSON/`FormData`, `ApiError`) plus one module per
  resource, and components no longer call `fetch` or `axios` directly. Guarded
  by `scripts/verify-repo.mjs` (check 12) and
  `backend/tests/unit/contracts/frontend-layer.test.js`; see `docs/frontend.md`.
- The customer auth domain is layered (`routes → controller → service → repository`
  with a validator), and the API URL / API layer rules are documented and
  guarded. `authRoutes.js` went from 350 lines of inline Mongoose, JWT signing
  and HTML email to middleware plus one controller call per URL.
- A layering contract (`backend/tests/unit/contracts/layering.test.js`) makes
  repositories the only layer allowed to import a Mongoose model. It is a
  ratchet: the domains still to migrate are listed explicitly, a new violation
  fails immediately, and a migrated file must be removed from the list in the
  same commit. `npm run verify:repo` prints the remaining set.
- The API client in each app is now type-checked: `tsconfig.json` parses every
  source file, and `src/api/client.js` opts into `checkJs` with `// @ts-check`
  plus JSDoc types for the request options, the error shape and every verb. The
  root `typecheck` script and the CI web job run it; `verify-repo` and the
  frontend contract test fail if an app loses either the config or the pragma.
- Web test suites: transport and endpoint-contract tests for every app, auth
  flow coverage (register mode, admin login success/failure, session cleared on
  401), `collectCoverageFrom` and `coverageThreshold` floors per manifest.
- Dead weight removed from the three apps: 0-byte modules, 14 MB of duplicated
  unreferenced assets, the no-op `reportWebVitals` boilerplate, and unused
  dependencies (`axios`, `cra-template`, `crypto`, `@stripe/stripe-js`,
  `@iconify/react`, `@fortawesome/fontawesome-free`).

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

- The storefront production build no longer fails on a named `React` import that
  Jest tolerated but CRA's Webpack bundle rejected.
- The company dashboard's Vercel build, output directory, SPA fallback, and Node
  runtime are now repository-owned and covered by a delivery contract test.
- `PATCH /company/auth/update-status` now updates the `companyId` the admin
  dashboard sends in the body — it previously read an id only a company token
  carries, so every admin approval answered 400 — and rejects a status outside
  the model enum.
- `GET /api/search` escapes regex metacharacters, so a `[` in the search box is
  a search again instead of a 500, and company register/login answer 400 for a
  missing field instead of 500.
- Company password reset rejects an expired token, answers `{ success: true }`
  instead of the historical `succes` typo, and no longer logs the company
  document (which carried the password hash and the reset token).
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
