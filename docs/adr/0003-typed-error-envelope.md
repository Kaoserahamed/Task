# ADR 0003 — One error envelope, thrown not returned

- **Status:** Accepted
- **Date:** 2026-09-23

## Context

Failures were generated at the point of failure, by hand: each controller had
its own `try/catch` and wrote its own shape. The result was at least four
different bodies for the same kind of problem (`{ success, error }`,
`{ success: false, message }`, `{ message, error }`, plain `500`s from Express),
and a malformed multipart payload produced an unhandled 500 rather than a 400.

Clients had to guess; the front-ends ended up reading `error || message ||`
nothing.

## Decision

- A small taxonomy in `backend/utils/errors.js`: `AppError` plus
  `BadRequestError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`,
  `NotFoundError`, `ConflictError`, `TooManyRequestsError`. Each carries
  `status`, `code` and optional `details`, and knows nothing about HTTP.
- Handlers **throw** these instead of writing a response. `middleware/asyncHandler.js`
  forwards rejected promises to Express so a `try/catch` is not needed for that.
- One `middleware/errorHandler.js` translates everything that reaches it:
  our errors, Mongoose (`ValidationError`, `CastError`, `11000`), body-parser,
  multer and `jsonwebtoken`, mapping each to a status and a stable code.
- The wire contract is always
  `{ success: false, error: <human message>, code: <stable machine code> }`,
  with `details` spread in when a caller needs to act (for example
  `availableSeats`).
- Unknown errors are logged with their stack and reported as a generic 500 in
  production; operational errors keep their message everywhere.

## Consequences

- Clients branch on `code`, never on prose. The existing front-ends keep working
  because `success` and `error` are unchanged.
- Log lines are filterable (`code=CORS_BLOCKED`), and a 5xx is always a real
  defect worth an alert.
- Cost: a status decision lives in one file, so a new error type must be added
  there rather than at the call site — deliberate, since that is the list we
  want to review.

## Alternatives considered

- **`http-errors` + a thin wrapper** — solves part of it, but the mapping for
  Mongoose/multer/JWT errors would still have been scattered.
- **Return result objects (`{ ok, error }`) from services** — makes every call
  site check a union; throwing keeps the happy path linear.
