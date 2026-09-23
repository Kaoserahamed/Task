# Backend Scripts

Operator commands. None of them run as part of the server boot, and every one
that writes data is documented in [docs/](../../docs/README.md).

| Script                | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| `seedDemoAccounts.js` | Create/refresh the demo user, admin and company  |
| `seedTourPackages.js` | Create five sample tour packages                 |
| `run-migrations.js`   | Apply the versioned migrations in `migrations/`  |
| `check-coverage.js`   | Coverage floors (run by `npm run test:coverage`) |

## Seeding demo data

Both seed scripts read their secrets from the environment and never from the
source tree:

```bash
cd backend
node scripts/seedDemoAccounts.js    # needs DEMO_*_EMAIL and DEMO_*_PASSWORD
node scripts/seedTourPackages.js    # needs DEMO_COMPANY_EMAIL, DEMO_COMPANY_PASSWORD
```

They exit with an error when the variables are missing, so an unattended run
cannot silently create an account with a guessed password. See
`backend/.env.example`.

The HTTP equivalents (`GET /api/seed-tours`, `POST /api/demo/create-accounts`)
exist for browser testing, but they are mounted **only** when
`SEED_ENABLED=true`; otherwise the paths 404 like any other unknown route.

## Migrations

```bash
cd backend
node scripts/run-migrations.js --dry-run   # what would run
node scripts/run-migrations.js             # apply and record
```

Format, contract and rollback story:
[`migrations/README.md`](migrations/README.md) and
[`docs/migrations.md`](../../docs/migrations.md).
