# Backend Scripts

Operator commands. None of them run as part of the server boot, and every one
that writes data is documented in [docs/](../../docs/README.md).

| Script                | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `seedDemoAccounts.js` | Create/refresh the demo user, admin and company      |
| `seedTourPackages.js` | Create five sample tour packages                     |
| `create-indexes.js`   | Create declared MongoDB indexes after schema changes |
| `backup-mongodb.sh`   | Create and upload an encrypted logical backup        |
| `restore-mongodb.sh`  | Restore a logical backup with an explicit guard      |
| `run-migrations.js`   | Apply the versioned migrations in `migrations/`      |
| `check-coverage.js`   | Coverage floors (run by `npm run test:coverage`)     |

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

## Database indexes and backups

Create the model indexes after a schema/index change from a controlled operator
session:

```bash
cd backend
npm run db:indexes
```

Native DocumentDB backups run daily through AWS and are retained for seven days.
For an independent logical copy, install the MongoDB Database Tools on a trusted
operator host, authenticate with the task execution/deploy role or an approved
AWS profile, and run:

```bash
export MONGODB_URI='mongodb://.../tourmate?tls=true&tlsCAFile=/etc/ssl/certs/aws-rds-global-bundle.pem&replicaSet=rs0&retryWrites=false'
export S3_BACKUP_BUCKET='task-production-backups'
export AWS_REGION='us-east-1'
export BACKUP_KMS_KEY_ID='alias/task-production'
./scripts/backup-mongodb.sh
```

The archive is written under `mongodb/` in the private, versioned S3 backup
bucket. The restore command requires `CONFIRM_RESTORE=RESTORE` and a `BACKUP_KEY`,
and restores only the `tourmate` database. See [disaster-recovery.md](../../docs/disaster-recovery.md)
for the recovery decision tree and rehearsal procedure.

Format, contract and rollback story:
[`migrations/README.md`](migrations/README.md) and
[`docs/migrations.md`](../../docs/migrations.md).
