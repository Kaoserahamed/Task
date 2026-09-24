# ADR 0002 — Hermetic unit tests, opt-in integration tests

- **Status:** Accepted
- **Date:** 2026-09-23

## Context

The first real backend test (`tests/tour.test.js`) started
`mongodb-memory-server` in a `beforeAll`. That downloads a ~780 MB `mongod`
binary on first use and needs network access to do it. As the only suite, it
made `npm test` slow, platform-sensitive and impossible to run offline — the
opposite of what a gate that runs on every push should be.

## Decision

Two suites, two configuration files, two commands:

| Suite          | Location                    | Needs                                                 | Runs in                                        |
| -------------- | --------------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| Unit (default) | `backend/tests/unit`        | Nothing but npm deps                                  | `npm test`, every push                         |
| Integration    | `backend/tests/integration` | A MongoDB (`MONGODB_URI_TEST` or an in-memory server) | `npm run test:integration`, a dedicated CI job |

- `jest.config.js` collects `tests/unit` only; `jest.integration.config.js`
  collects `tests/integration` and can point at any MongoDB through
  `MONGODB_URI_TEST`.
- Unit specs stub the repository (`jest.mock`), so they assert business rules
  rather than database behaviour.
- Integration specs drive the _real_ `createApp()` against a _real_ database,
  which is where Mongoose indexes, casts and atomic updates are proven.
- CI gives the integration job a `mongo:7` service container, so no large binary
  is downloaded on every run.

## Consequences

- `npm test` and `npm run verify` are fast, offline and deterministic — they can
  gate every push.
- A rule that only the database can validate (a unique index, a `$gte` guard in
  an update) needs an integration test; "unit tests are green" is not evidence
  for it. `docs/testing.md` says which suite a new test belongs to.
- Cost: two Jest configurations and a small amount of duplicated setup.

## Alternatives considered

- **Only integration tests** — accurate but slow; the fast feedback loop that
  makes refactoring safe would be lost.
- **Only unit tests** — would have hidden the seat-oversell race fixed in the
  same change, because the guard lives inside the database update.
- **Testcontainers** — needs Docker on every developer machine; the memory
  server plus a compose file already covers both cases.
