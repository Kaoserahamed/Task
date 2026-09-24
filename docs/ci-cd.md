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

| Job                 | Runs                                                                       | Fails on                                                 |
| ------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------- |
| `lint-backend`      | `npm run lint --prefix backend`                                            | any ESLint error                                         |
| `backend-tests`     | `npm run test:coverage --prefix backend`                                   | test failure **or** coverage threshold breach            |
| `integration`       | `npm run test:integration --prefix backend` on a `mongo:` service          | test failure                                             |
| `web`               | matrix over `frontend`, `admin`, `tourcompanydashboard`                    | lint error, test failure, or build failure               |
| `typecheck-backend` | `npm run typecheck --prefix backend`                                       | any TypeScript error                                     |
| `fresh-clone`       | `npm run setup`, repository guard, format check, and full `npm run verify` | install, test, type, format, or repository drift failure |
| `docker`            | `docker compose -f docker-compose.test.yml build` and the image health     | build failure or a container that never turns healthy    |

The `fresh-clone` job is what makes the README's Quick Start executable: it runs
`npm run setup` and then the complete root `npm run verify` path on a checkout
with no `node_modules`, so a missing lockfile, broken script, test, or formatter
fails CI before a contributor hits it. The separate `security.yml` workflow also
runs Terraform `fmt`, `init`, `validate`, an offline `plan`, and a Trivy IaC
policy scan on every push and pull request.

### Node version

All jobs pin **Node 20** via `actions/setup-node@v4` with an `npm` cache keyed on
each package's `package-lock.json`.

## Local verification

```bash
npm run verify      # everything: lint + format + typecheck + verify:repo + test
npm run lint        # lint backend + every CRA app
npm run test        # backend + CRA tests
npm run format:check
```

The `verify` script is intentionally identical in spirit to CI so a developer
can catch gate failures before pushing.

## Deployment note

Production deployments build each CRA app with `npm run build` and serve the
static bundle alongside the Express API (see `docker-compose.yml` and
`docs/development.md`). The CI `web` job performs the same production build, so
a failing CI build always corresponds to a build that would fail to deploy.

## Dependabot

`.github/dependabot.yml` opens weekly `npm`, `github-actions` and `docker` PRs
with a 4-open-PR cap, scoped per workspace so upgrades are isolated and
reviewable — the API base image (`backend/Dockerfile`) moves with its own PR.

A pull request is reviewed against the template in
`.github/pull_request_template.md`: it repeats the gate (`npm run verify`), asks
for the test that covers the change, and requires a `CHANGELOG.md` entry — the
review checklist that `CONTRIBUTING.md` describes in full.
