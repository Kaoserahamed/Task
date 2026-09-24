# Disaster recovery

This runbook covers recovery of the AWS production deployment. The application
uses **Amazon DocumentDB** (MongoDB-compatible), not PostgreSQL. Terraform
provides the primary backup and availability controls; the shell scripts in
`backend/scripts/` provide an independent logical copy.

## Targets and assumptions

| Target | Objective | Verification |
| --- | --- | --- |
| Database RPO | ≤ 15 minutes | Native DocumentDB backup/restore drill and a current logical archive |
| Application RTO | ≤ 2 hours | ECS task definitions, immutable ECR images, ALB and secrets verified |
| Upload RPO | ≤ 15 minutes | S3 versioning and object inventory review |
| Configuration RTO | ≤ 1 hour | Encrypted Terraform state and tagged infrastructure |

The targets are objectives, not guarantees. A restore is not considered
complete until the readiness probe, smoke checks, and data-count checks pass.
The first production drill must validate the chosen RPO/RTO and adjust this
document if AWS or the application constraints differ.

## Recovery decision tree

1. **Check the application first.** `GET /health/live` proves the process is
   running. `GET /health/ready` proves the API can reach DocumentDB. ECS logs and
   the request ID in `x-request-id` identify the failing dependency.
2. **A bad image is suspected:** keep the database untouched. Select the last
   known-good immutable ECR tag, run the AWS production workflow with that
   `image_tag`, and wait for ECS and the ALB health check.
3. **DocumentDB is unavailable or corrupt:** do not repeatedly restart ECS. Take
   a diagnostic connection attempt, preserve logs, and use the native restore
   procedure below. If the cluster is not yet recovered, restore the latest
   logical S3 archive into a clean target cluster.
4. **Data was deleted or overwritten:** stop writes, identify the last known-good
   backup, and use a restored cluster or an isolated recovery database. Never
   run a destructive restore against production without the incident commander’s
   approval and the `CONFIRM_RESTORE=RESTORE` guard.
5. **Secrets are suspect:** rotate the affected Secrets Manager value through the
   approved change process, update the ECS task, and redeploy. Never print a
   secret to a terminal or CI log.

## Native DocumentDB recovery

Terraform configures encrypted, deletion-protected DocumentDB with a seven-day
backup retention window. The incident operator should:

1. Stop or scale the API to prevent writes during the recovery decision.
2. In the AWS console, record the cluster identifier, region, event timeline, and
   the exact recovery point.
3. Restore to a **new** DocumentDB cluster rather than deleting the failed
   cluster. Use the selected point-in-time backup or snapshot.
4. Confirm TLS, subnet group, security group, parameter group, encryption, and
   deletion protection on the replacement cluster.
5. Update the application secret with the replacement endpoint and credentials,
   deploy the ECS task, then wait for `/health/ready` and the public
   `/health/live` check.
6. Run data checks (counts, sample records, indexes, and migration history) before
   directing traffic back to the cluster.
7. Keep the failed cluster available for forensic comparison until the incident is
   closed. Do not destroy it as part of the first recovery attempt.

## Logical S3 backup and restore

The logical backup is an independent copy, not a replacement for native
point-in-time recovery. The bucket is private, KMS-encrypted, and versioned.

### Create a backup

Run from a trusted Linux operator host with MongoDB Database Tools and the AWS
CLI installed. The host must be able to reach the private DocumentDB endpoint,
normally through an approved VPN, bastion, or Systems Manager session.

```bash
cd backend
export MONGODB_URI='mongodb://.../tourmate?tls=true&tlsCAFile=/etc/ssl/certs/aws-rds-global-bundle.pem&replicaSet=rs0&retryWrites=false'
export S3_BACKUP_BUCKET="$(terraform -chdir=../infrastructure/terraform output -raw backups_bucket)"
export AWS_REGION='us-east-1'
export BACKUP_KMS_KEY_ID='alias/task-production'
./scripts/backup-mongodb.sh
```

Record the printed `s3://<bucket>/mongodb/<timestamp>.archive.gz` URI in the
incident/change record. The command fails closed when a required variable or
tool is missing and deletes its temporary local archive on exit.

### Restore an archive

Prefer a new, empty DocumentDB cluster. Verify the backup’s timestamp and
obtain approval before the destructive operation:

```bash
cd backend
export MONGODB_URI='mongodb://.../tourmate?tls=true&tlsCAFile=/etc/ssl/certs/aws-rds-global-bundle.pem&replicaSet=rs0&retryWrites=false'
export S3_BACKUP_BUCKET='task-production-backups'
export AWS_REGION='us-east-1'
export BACKUP_KEY='mongodb/YYYYMMDDTHHMMSSZ.archive.gz'
export CONFIRM_RESTORE='RESTORE'
./scripts/restore-mongodb.sh
```


## Verification checklist

After either recovery path:

```bash
curl --fail https://api.example.com/health/live
curl --fail https://api.example.com/health/ready
# Authenticated smoke test: login, list one tour, create/read one test booking.
```

- [ ] `/health/live` returns 200.
- [ ] `/health/ready` returns 200 and DocumentDB is healthy.
- [ ] ECS has the intended task definition and all services are stable.
- [ ] ALB target health, WAF events, and CloudWatch alarms are reviewed.
- [ ] User, tour, booking, and review counts are plausible.
- [ ] `npm run db:indexes` or the equivalent operator index command succeeds.
- [ ] The migration ledger is present and the next migration is intentionally
      planned; do not replay a migration blindly.
- [ ] A test upload succeeds and a presigned read uses the private S3 policy.
- [ ] Logs contain no token, cookie, password, or database credential.
- [ ] The incident record includes the recovery point, data checks, approver, and
      follow-up actions.

## Rehearsal schedule

Run a restore drill at least quarterly and after a material schema, provider, or
network change. Use an isolated DocumentDB cluster, not production. Measure the
time from decision to healthy service and compare it to the 2-hour application
RTO. Record gaps, owners, and due dates in the change log.

## Preventive controls

- Terraform remote S3 state must be encrypted and access-restricted; never put
  state, backups, or credentials in Git.
- ECR images are immutable and retained by lifecycle policy; restore the last
  known-good image, not a mutable `latest` tag.
- S3 versioning and Object Lock/retention policy changes require a separate
  reviewed infrastructure change.
- Keep at least one current logical archive and one verified native backup
  point. A backup that has never been restored is not a recovery plan.

The script downloads to a temporary directory, restores only the `tourmate`
database with `--drop`, and removes the local file on exit. It intentionally
does not accept a missing confirmation value.

