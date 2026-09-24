# Architecture

## Shape of the system

```
                 ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
   browser ────▶ │ frontend/  (CRA, :3000)│ │ admin/ (CRA, :3001) │  │ tourcompanydashboard/ │
                 │ customer store-front  │  │ operations console  │  │ (CRA, :3002)          │
                 └───────────┬──────────┘  └───────────┬─────────┘  └───────────┬─────────┘
                             │  REST (axios) + Socket.IO                        │
                             └───────────────────┬─────────────────────────────┘
                                                 ▼
                                     backend/  (Express, :4000)
                                                 │
                                        ┌────────┴────────┐
                                        ▼                 ▼
                                   MongoDB          Cloudinary / Pusher /
                                  (Mongoose)        Sendinblue / weather API
```

Four applications, one API, one database. The React apps hold no business rules
that the API does not also enforce; they are presentation plus session state.

## Backend layers

`backend/` is organised so that each layer has exactly one reason to change.

| Layer         | Directory                          | Responsibility                                                               |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| Composition   | `app.js`                           | Build the Express app: middleware order, routers, probes, 404, error handler |
| Boot          | `index.js`                         | Read env, connect to MongoDB, listen, Socket.IO, graceful shutdown           |
| HTTP          | `routes/`, `controllers/`          | Route table; translate HTTP ↔ domain values. No business rules               |
| Input         | `validators/`                      | Parse and reject malformed payloads; pure functions, no I/O                  |
| Domain        | `services/`                        | Business rules; throws typed errors; emits realtime events                   |
| Persistence   | `repositories/`                    | The only place that calls Mongoose                                           |
| Cross-cutting | `middleware/`, `utils/`, `config/` | Errors, logging, rate limits, CORS, request ids                              |

The request path for a tour write looks like this:

```
POST /api/tours
  → requestId            attaches req.id, echoes x-request-id
  → helmet / cors        security headers, origin allow-list
  → express.json         body parsing (1 MB cap)
  → apiLimiter           runaway-client protection
  → routes/tours.js      upload.array('images') → validateTour
  → controllers/tour.js  buildCreatePayload() → tourService.create()
  → services/            business rules, emits 'tour_created'
  → repositories/        Tour.create()
  → res 201 { success, message, tour }
```

Failures never travel back as ad-hoc bodies: anything thrown becomes
`{ success: false, error, code }` through `middleware/errorHandler.js`.

### Layering status (honest, and enforced)

The table above is the target. Migration is in progress, and the gap is pinned
by `backend/tests/unit/contracts/layering.test.js` rather than left for a
reviewer to discover. That contract is a **ratchet**: repositories are the only
layer allowed to import a Mongoose model, and the list of files that still break
the rule can only shrink.

| Status  | Domains                                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------- |
| Layered | `tour` (create/update/status/seats/suggestions), `user` (register, login, search, profile, avatar, password reset)        |
| Pending | `company`, `booking`, `review`, `admin`, `dashboard`, `wishlist`, `chat`, `place`, `weather`, `suggestion`, `seed`/`demo` |

`npm run verify:repo` prints the exact set of pending files on every run, and the
contract test fails if a **new** file reaches for a model _or_ if a migrated file
is left in the pending list. Two rules are already unconditional and have no
exceptions: a service may not see `req`/`res`/`express` or a model, and a
controller may not import a repository — it goes through a service.

## Front end conventions

- One CRA app per audience; each talks to the API through `src/config/api.js`,
  which reads `REACT_APP_API_URL`.
- Session state lives in React context (`AuthContext`), tokens in `localStorage`.
- Formatting and linting are shared with the API (ESLint + Prettier), and every
  app runs its own tests behind `npm run test:ci`.

## Where does my change belong?

| Change                            | Goes in                                   |
| --------------------------------- | ----------------------------------------- |
| A new endpoint                    | `routes/` + `controllers/` (+ validator)  |
| A new business rule               | `services/` with a unit test              |
| A new query or index              | `repositories/` / `models/`               |
| A header, limiter or parsing rule | `app.js` with the other middleware        |
| Documentation of a decision       | `docs/adr/` (see ADR 0001 for the format) |

Further reading: [adr/](adr/), [api.md](api.md), [testing.md](testing.md),
[security.md](security.md), [operations.md](operations.md).
