# ADR 0001 — A layered backend, separated from the HTTP server

- **Status:** Accepted
- **Date:** 2026-09-23

## Context

`backend/index.js` did everything at once: it created the Express app, configured
middleware, declared some routes inline (and others in `routes/`), registered the
error handler _before_ several routers, connected to MongoDB, started a listener
and initialised Socket.IO. The consequences were concrete:

- no test could exercise a route without opening a port and a database;
- the tour controller was 640 lines of `try/catch`, `res.status(...)` and MongoDB
  queries, so a rule such as "you cannot book more seats than are available" was
  impossible to test in isolation;
- middleware order bugs (an error handler in the middle of the stack) were
  invisible until production.

## Decision

Split the process into a buildable application and a thin boot script, and give
the tour domain four explicit layers:

```
request → routes/          route table only
        → validators/      parse and reject malformed input (pure, testable)
        → controllers/     translate HTTP ↔ domain, no business rules
        → services/        business rules, throw typed errors
        → repositories/    the only place that talks to Mongoose
```

- `app.js` exports `createApp()`, which returns a fully wired Express app and
  performs no I/O.
- `index.js` connects to MongoDB, starts the listener, initialises Socket.IO and
  handles signals (with graceful shutdown).
- `utils/errors.js` + `middleware/errorHandler.js` own the failure contract.

## Consequences

- `supertest(createApp())` covers routes, validators, controllers and the error
  handler without a database; the unit suite runs in seconds and needs nothing
  installed beyond npm dependencies.
- Business rules can be unit-tested against a stub repository.
- The HTTP layer, the rules and the persistence details can change
  independently: swapping Mongoose for another driver touches only
  `repositories/`.
- Cost: more files, and a change may touch several layers. The layering is
  enforced by review, not by a linter (see ADR 0005 for the gates).

## Alternatives considered

- **Keep the monolith, add tests around `index.js`** — would have required a
  running MongoDB for every test and left middleware ordering untested.
- **Adopt a framework with DI (NestJS)** — a rewrite far beyond the scope, and
  the existing Express knowledge in the team would have been thrown away.
