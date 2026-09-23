# Operations

## Probes

| Endpoint        | Purpose    | Answer                                                                                                                                      |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `/health/live`  | Liveness   | `200 { status: 'alive', uptime }` — the process is serving. Never touches the database, so a slow Mongo cannot restart a healthy container. |
| `/health/ready` | Readiness  | `200` when the Mongoose connection is up, `503 { status: 'degraded' }` otherwise. Point load-balancer/readiness checks here.                |
| `/health`       | Legacy     | `{ status: 'healthy', database }`, kept for existing uptime checks.                                                                         |
| `/`             | Smoke test | `{ status: 'ok', environment, isVercel, timestamp }`.                                                                                       |

The `docker-compose.yml` stack wires a `healthcheck` and starts the API only
after MongoDB reports healthy.

## Logs

- Structured JSON through **pino** (`backend/utils/logger.js`). One line per
  event, with `service`, `env`, `level` and an ISO timestamp.
- `LOG_LEVEL` selects the level (`info` in production, `silent` under Jest).
- Every request carries `x-request-id`: pass your own to correlate with an
  upstream system, otherwise one is generated and echoed back. Include it when
  reporting a bug — it identifies the exact request lines.
- `Authorization` headers, cookies and password fields are redacted, so a log
  sink is safe to share.
- A 5xx logs at `error` with the stack; a 4xx logs at `debug` with its code.

Typical line:

```json
{
  "level": 30,
  "time": "2026-09-23T10:00:00.000Z",
  "service": "task-backend",
  "env": "production",
  "requestId": "2f0c...",
  "msg": "api listening",
  "port": 4000
}
```

## Running it

```bash
npm run stack:up            # docker compose: MongoDB + API (development)
npm run stack:down          # stop
npm run stack:test:up       # MongoDB for the integration suite
npm run stack:test:down     # stop and delete the test volume
```

Graceful shutdown: on `SIGTERM`/`SIGINT` the API stops accepting connections,
finishes in-flight requests, closes the Mongo connection and exits `0`
(bounded by the orchestrator's kill timeout — keep it above a few seconds).

## Runbook

**The API answers 503 on `/health/ready`.**
Check `MONGODB_URI` and the database's network access list; the log line
`mongodb connected` never appeared, or `request failed` repeats with a driver
error. A wrong `JWT_SECRET` does _not_ affect readiness — it shows up as 401s.

**A user reports a 500.**
Ask for the `x-request-id` from the response header, then grep the logs for it.
The `err` field carries the stack; the response deliberately does not.

**A user cannot sign in and sees 429.**
The credential rate limit (30 per 15 minutes per IP) is doing its job. Confirm
the reverse proxy sets a real client IP; otherwise every client shares one
bucket and `trust proxy`/`X-Forwarded-For` needs fixing before the limit is
raised.

**Uploads fail with 413.**
`FILE_TOO_LARGE` means the image exceeded 5 MB (`config/upload.js`);
`PAYLOAD_TOO_LARGE` means the JSON body exceeded `JSON_BODY_LIMIT` (1 MB).
Both are typed errors, visible in the logs with the request id.

**A deploy shipped a regression.**
`main` is deployable at every commit: revert the merge/squash commit, push, and
the pipeline rebuilds. Rolling forward is preferred only when a migration is
already applied — migrations are additive and applied before the code that
needs them.

**Seeding accidentally enabled in production.**
Unset `SEED_ENABLED` and redeploy/restart: the routes disappear from the table.
Then rotate the demo passwords, since those accounts exist in the database.
