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

| Job                 | Runs                                                    | Fails on                                      |
| ------------------- | ------------------------------------------------------- | --------------------------------------------- |
| `lint-backend`      | `npm run lint --prefix backend`                         | any ESLint error                              |
| `backend-tests`     | `npm run test:coverage --prefix backend`                | test failure **or** coverage threshold breach |
| `web`               | matrix over `frontend`, `admin`, `tourcompanydashboard` | lint error, test failure, or build failure    |
| `typecheck-backend` | `npm run typecheck --prefix backend`                    | any TypeScript error                          |

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

`.github/dependabot.yml` opens weekly `npm` and `github-actions` PRs with a
4-open-PR cap, scoped per workspace so upgrades are isolated and reviewable.
