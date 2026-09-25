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

## Wishlist

All wishlist routes require a customer access token. The API derives ownership
from the verified account and ignores any email sent by the client.

| Method | Path                           | Body / result                                        |
| ------ | ------------------------------ | ---------------------------------------------------- |
| GET    | `/api/wishlist`                | `{ success, wishlist }` for the token owner          |
| POST   | `/api/wishlist/add`            | `{ tourId }`; returns `201` or `409` when duplicated |
| DELETE | `/api/wishlist/remove/:tourId` | Removes the token owner's item; `404` when absent    |

`tourId` must be a 24-character MongoDB ObjectId. A forged body/query email
never selects another account. The response does not repeat the owner's email.
The `(email, tourId)` database key is unique; run the wishlist normalization
migration and `npm run db:indexes` during deployment.

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

## Bookings

`POST /api/bookings/add` requires a customer bearer token. The request is checked
against a strict schema before any account or booking database access. The account
email, user id, and total price are server-owned fields: `email`, `userId`, and
`totalAmount` are rejected rather than trusted. The total is calculated from the
persisted tour price and the validated traveler count.

Required fields are `tourId`, `firstName`, `lastName`, `phone`, `address`, `city`,
`country`, `travelers`, `startDate`, and `paymentMethod`. `tourId` must be a
MongoDB ObjectId, `travelers` must be a positive whole number, and payment methods
are `credit-card`, `paypal`, or `bank-transfer`. Credit-card bookings also require
`cardHolder` and `cardNumber`; the API stores only the card's last four digits.
Unknown fields, invalid dates, invalid payment methods, and malformed values return
`400 VALIDATION_ERROR` with an `errors` array containing `field` and `message`.

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
