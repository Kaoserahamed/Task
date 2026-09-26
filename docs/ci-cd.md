# CI / CD

## Pipeline overview

The GitHub Actions workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
runs on every push and pull-request to `main` / `develop`. It mirrors the local
`npm run verify` script so "green locally" is a reliable predictor of "green in CI".

```
┌──────────────┐   ┌──────────────┐   ┌──────┐   ┌──────┐
│ lint-backend │   │ backend-tests│   │ web  │   │type- │
│  (matrix)    │   │  +coverage   │   │ (mtx)│   │check │
└──────┬───────┘   └──────┬───────┘   └──────┘   └──────┘
       │ all must pass    │ artifact uploaded
```

### Jobs

| Job                 | Runs                                                                                         | Fails on                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `lint-backend`      | `npm run lint --prefix backend`                                                              | any ESLint error                                                            |
| `backend-tests`     | `npm run test:coverage --prefix backend`                                                     | test failure **or** coverage threshold breach                               |
| `integration`       | `npm run test:integration --prefix backend` on a `mongo:` service                            | test failure                                                                |
| `web`               | matrix over `frontend`, `admin`, `tourcompanydashboard`                                      | lint error, test failure, or build failure                                  |
| `typecheck-backend` | `npm run typecheck --prefix backend`                                                         | any TypeScript error                                                        |
| `fresh-clone`       | `npm run setup`, repository guard, offline boundary, format check, and full `npm run verify` | install, test, type, format, provider-boundary, or repository drift failure |
| `commitlint`        | Conventional Commit validation over the push or pull-request range                           | a non-conforming commit message                                             |
| `docker`            | `docker compose -f docker-compose.test.yml build` and the image health                       | build failure or a container that never turns healthy                       |

The `fresh-clone` job is what makes the README's Quick Start executable: it checks
out the repository, deliberately configures `actions/setup-node@v4` **without** an
npm `cache:` (a warm `~/.npm` would hide a lockfile that cannot install cold), runs
`npm run setup` and then the complete root `npm run verify` path on a checkout with
no `node_modules`, so a missing lockfile, broken script, test, or formatter fails CI
before a contributor hits it.

Its final step is the reproducibility gate itself:

```bash
set -o pipefail
npm run verify 2>&1 | tee fresh-clone-verify.log
status=${PIPESTATUS[0]}
echo "fresh-clone: npm run verify exit code: ${status}"
exit "${status}"
```

`PIPESTATUS[0]` is the exit code of `npm run verify` itself, not of `tee`, so the
job's done condition is a single number: **0 means a fresh clone installs, lints,
typechecks, tests and builds**. Any other value fails the job, and
`fresh-clone-verify.log` is uploaded as the `fresh-clone-verify-log` artifact so the
failing output can be inspected without re-running the job.

### Node version

All jobs pin **Node 20** via `actions/setup-node@v4` with an `npm` cache keyed on
each package's `package-lock.json`.

## Local verification

```bash
npm run verify      # everything: lint + format + typecheck + verify:repo + test + build
npm run lint        # lint backend + every CRA app
npm test            # backend + CRA tests
npm run build       # production bundles for all three CRA apps
npm run format:check
```

The `verify` script is intentionally identical in spirit to CI so a developer
can catch gate failures before pushing.

## Infrastructure pipeline (Terraform)

Three workflows cover `infrastructure/terraform`:

| Workflow             | Trigger                         | Gate                                                                                                                |
| -------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `terraform-plan.yml` | PR touching `infrastructure/**` | `fmt -check -recursive`, local-backend `init`, provider-lock check, `validate`, offline `plan`, tfsec HIGH/CRITICAL |
| `security.yml`       | every push and pull request     | `fmt`, `init -backend=false`, `validate`, Trivy IaC policy scan                                                     |
| `ci.yml`             | every push and pull request     | tfsec HIGH/CRITICAL scan of `infrastructure/terraform`                                                              |
| `aws-production.yml` | `v*` tag or manual dispatch     | `npm run verify` plus the integration suite, then apply against the remote state                                    |

The review job never talks to AWS. It writes a `ci_backend_override.tf` that
swaps the S3 backend for a local one and sets the provider's
`skip_credentials_validation` / `skip_requesting_account_id` / `skip_metadata_api_check`,
then runs `terraform init` and plans against `terraform.tfvars.example` with
`-refresh=false`, uploading `terraform.tfplan` and `terraform-plan.txt` as a build
artifact and posting a bounded plan excerpt back to the pull request.

The override exists because `terraform init -backend=false` is **not** sufficient
on its own: it skips backend configuration, which leaves the backend unconfigured
so every later command — `plan` included — fails with
`Backend initialization required`. A local backend in the override file gives the
plan somewhere to write, and the provider skip attributes avoid an STS call, so a
pull request needs no AWS credentials at all. Nothing in that job applies.

The action references are pinned to resolvable versioned releases
`aquasecurity/trivy-action@v0.36.0` and
`aquasecurity/tfsec-action@v1.0.3`. A repository contract rejects missing
release tags so a security job cannot appear configured while failing before
its scanner starts.

Every high-severity Terraform finding is blocking. The dedicated PR plan uses
[aquasecurity/tfsec-action](https://github.com/aquasecurity/tfsec-action) with
`soft_fail: false --severity HIGH,CRITICAL`, and the same directory is scanned
in the always-on CI workflow; the security workflow additionally applies
Trivy's misconfiguration checks. A finding therefore fails the relevant
workflow rather than being reported for later review.

### Remote state

`infrastructure/terraform/backend.tf` declares the S3 backend with
`encrypt = true`. Encryption is a property of the configuration, not a flag, so a
local or CI `init` cannot silently create an unencrypted state object. The
location itself is supplied by the deployment workflow through `-backend-config`
flags, so no account id or bucket name is committed:

| Repository variable | `-backend-config` key | Purpose                                                     |
| ------------------- | --------------------- | ----------------------------------------------------------- |
| `TF_STATE_BUCKET`   | `bucket`              | S3 bucket holding the state file                            |
| `TF_STATE_KEY`      | `key`                 | State path, defaults to `task/production/terraform.tfstate` |
| `TF_LOCK_TABLE`     | `dynamodb_table`      | DynamoDB table used for state locking                       |

The DynamoDB table serialises concurrent applies: two overlapping CI runs, or a
local apply racing a deploy, would otherwise write the same state key and silently
lose one run's changes. Terraform generates the DocumentDB, Redis and JWT
credentials **inside this state**, so the bucket must be access-restricted like
the production secrets themselves. Configure all three as repository variables
(the names are not secret; the state they hold is).

To work locally against the same state:

```bash
cd infrastructure/terraform
terraform init \
  -backend-config="bucket=$TF_STATE_BUCKET" \
  -backend-config="key=$TF_STATE_KEY" \
  -backend-config="region=$AWS_REGION" \
  -backend-config="dynamodb_table=$TF_LOCK_TABLE" \
  -backend-config="encrypt=true"
```

Creating the bucket (versioning + encryption + restricted policy) and the lock
table is a one-time operator action; step-by-step preparation is listed in
[infrastructure/terraform/README.md](../infrastructure/terraform/README.md).

## Deployment note

The company dashboard's Vercel project is rooted at `tourcompanydashboard/` and
keeps its framework, install command, build command, output directory, SPA
fallback, and Node 20 runtime in `tourcompanydashboard/vercel.json` and
`tourcompanydashboard/.nvmrc`. These settings are part of the repository rather
than mutable dashboard defaults, so CI, a local build, and the deployment all
run the same locked Node 20 toolchain. Set `REACT_APP_API_URL` in the Vercel
project before deployment; CRA inlines that value into the static bundle.

Production deployments for the other apps build each CRA app with `npm run build`
and serve the static bundle alongside the Express API (see `docker-compose.yml`
and `docs/development.md`). The CI `web` job performs the same production build,
so a failing CI build always corresponds to a build that would fail to deploy.

`npm run dependency:check` inventories the root tooling package and all four application manifests. The root intentionally has no runtime dependencies: runtime ownership stays with the package that ships the code. The same command verifies every committed lockfile, direct range synchronization, Node/npm compatibility, and reproducible dependency policy. `npm run dependency:report` prints the ownership counts for review.

`npm run dependency:audit` audits production dependency graphs with `--omit=dev`; development/build advisories remain visible in the full lockfile audit instead of being presented as shipped runtime risk.

## Dependabot

`.github/dependabot.yml` opens weekly `npm`, `github-actions` and `docker` PRs with a 4-open-PR cap, scoped per workspace so upgrades are isolated and reviewable — the API base image (`backend/Dockerfile`) moves with its own PR.

A pull request is reviewed against the template in
`.github/pull_request_template.md`: it repeats the gate (`npm run verify`), asks
for the test that covers the change, and requires a `CHANGELOG.md` entry — the
review checklist that `CONTRIBUTING.md` describes in full.
