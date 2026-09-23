# API

Base URL: `REACT_APP_API_URL` (default `http://localhost:4000`). All bodies are
JSON unless stated otherwise; mutating endpoints expect
`Authorization: Bearer <token>`.

## Response shape

Success:

```json
{ "success": true, "...": "endpoint specific fields" }
```

Failure — one envelope, everywhere, with a stable machine-readable `code`:

```json
{ "success": false, "error": "Tour not found", "code": "NOT_FOUND" }
```

| Code                 | Status | Meaning                                               |
| -------------------- | ------ | ----------------------------------------------------- |
| `VALIDATION_ERROR`   | 400    | The request body/query failed validation              |
| `INVALID_IDENTIFIER` | 400    | A path parameter cannot be cast (bad object id)       |
| `INVALID_JSON`       | 400    | The body is not valid JSON                            |
| `UNAUTHORIZED`       | 401    | No usable credential                                  |
| `TOKEN_EXPIRED`      | 401    | The JWT has expired                                   |
| `INVALID_TOKEN`      | 401    | The JWT is malformed or the signature is wrong        |
| `FORBIDDEN`          | 403    | Authenticated but not allowed                         |
| `CORS_BLOCKED`       | 403    | The `Origin` is not on the allow-list                 |
| `NOT_FOUND`          | 404    | Unmatched route, or the addressed resource is gone    |
| `DUPLICATE_KEY`      | 409    | A unique index rejected the write                     |
| `FILE_TOO_LARGE`     | 413    | Uploaded image above 5 MB                             |
| `PAYLOAD_TOO_LARGE`  | 413    | JSON body above `JSON_BODY_LIMIT`                     |
| `RATE_LIMITED`       | 429    | Rate limit exceeded (see `docs/security.md`)          |
| `INTERNAL_ERROR`     | 500    | A defect — the log line for the request has the stack |

Errors may add context fields, for example a failed booking:

```json
{
  "success": false,
  "error": "Only 2 seats available",
  "code": "VALIDATION_ERROR",
  "availableSeats": 2
}
```

## Health

| Method | Path            | Notes                                         |
| ------ | --------------- | --------------------------------------------- |
| GET    | `/`             | Smoke test: status, environment, timestamp    |
| GET    | `/health`       | Legacy combined check                         |
| GET    | `/health/live`  | Liveness — never touches the database         |
| GET    | `/health/ready` | Readiness — `503` when MongoDB is unreachable |

## Tours

| Method | Path                                        | Notes                                                                                     |
| ------ | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| GET    | `/api/tours`                                | All tours                                                                                 |
| GET    | `/api/tours/approved`                       | Approved only; empty result carries a message, not a 404                                  |
| GET    | `/api/tours/filter?category=&tourType=`     | `all` is the "no filter" sentinel; `category=custom` matches tours with a custom category |
| GET    | `/api/tours/pendingtours`                   | Awaiting review (admin)                                                                   |
| GET    | `/api/tours/:id`                            | Single tour, `404` when unknown                                                           |
| GET    | `/api/tours/:id/seat-availability`          | Seat projection                                                                           |
| GET    | `/api/tours/companytours/:companyId`        | A company's own tours                                                                     |
| GET    | `/api/tours/suggest-tours?destinations=a,b` | Suggestions by destination                                                                |
| GET    | `/api/tours/suggestions/:tourName`          | Fuzzy name suggestions (max 5)                                                            |
| POST   | `/api/tours`                                | `multipart/form-data`, field `images`; validated then stored as `draft`                   |
| PUT    | `/api/tours/:id`                            | `multipart/form-data`, fields `images`, `existingImages`; resets status to `draft`        |
| PATCH  | `/api/tours/:id/status`                     | `{ status: approved\|rejected\|pending, review? }`                                        |
| PATCH  | `/api/tours/:id/book-seats`                 | `{ seatsToBook }` — atomic, cannot oversell                                               |
| PATCH  | `/api/tours/:id/release-seats`              | `{ seatsToRelease }` — clamped to the group size                                          |
| PATCH  | `/api/tours/:id/increment-view`             | View counter                                                                              |
| PATCH  | `/api/tours/:id/increment-booking`          | Booking counter                                                                           |
| DELETE | `/api/tours/:id`                            | Removes the tour and its local image files                                                |

Multipart fields for create/update are JSON-encoded strings (`destinations`,
`includes`, `excludes`, `meals`, `transportation`, `duration`, `tourType`,
`weather`) — a malformed one is a `400 VALIDATION_ERROR` with the field name in
the message, never a 500.

## Other groups

| Group                                | Prefix                                    |
| ------------------------------------ | ----------------------------------------- |
| Customer auth                        | `/user/auth/*` (rate limited)             |
| Company auth                         | `/company/auth/*` (rate limited)          |
| Company profile, bookings, dashboard | `/company/*`, `/api/bookings/*`, `/api/*` |
| Admin                                | `/api/admin/*` (guarded mount)            |
| Chat                                 | `/api/chat/*`                             |
| Wishlist                             | `/api/wishlist/*`                         |
| Reviews                              | `/reviews/*`                              |
| Places / weather                     | `/api/*`                                  |
| Suggestions                          | `/Suggestion/:tourName`                   |

Seeding (`/api/seed-tours`, `/api/demo/create-accounts`) exists only when
`SEED_ENABLED=true`.
