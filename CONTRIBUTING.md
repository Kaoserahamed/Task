# Contributing to Task Tour Management System

Thanks for taking the time to contribute! This document describes how to set up
the repository, the code-style and quality gates CI enforces, and the workflow
we use for changes.

## Repository layout

```
.
├── backend/                # Express + MongoDB REST API (Node ≥ 20)
├── frontend/               # Customer React (CRA 5) app
├── admin/                  # Admin React (CRA 5) app
├── tourcompanydashboard/   # Tour-company React (CRA 5) app
├── docker-compose.yml      # Full stack (API + Mongo) for local dev
├── .github/                # CI workflow, CODEOWNERS, Dependabot
└── docs/                   # Architecture, testing, deployment guides
```

## Prerequisites

- Node.js **20.19+** (see `.nvmrc` at the repository root)
- npm **10+**
- Docker + Docker Compose (only required for the full-stack local dev server)

## One-command setup

```bash
# From the repository root only:
npm run setup        # installs every workspace package
```

## Development workflows

| Goal                       | Command (run from any package dir) |
| -------------------------- | ---------------------------------- |
| Start the API (watch mode) | `npm run dev`                      |
| Start a React dev server   | `npm start`                        |
| Run the full stack         | `docker-compose up --build`        |

## Quality gates (must stay green)

Run these before opening a pull request:

```bash
# From the repository root — runs every gate across all packages:
npm run verify
```

That script runs, in order:

1. **`npm run lint`** — ESLint on the backend (ESLint 9, flat config in
   `backend/eslint.config.js`) and on the three CRA apps (ESLint 8, legacy
   config in `.eslintrc.cjs`). **Any lint error fails the build** (`--max-warnings=0`
   is NOT needed — errors already fail; leftover warnings are tracked as tech debt).
2. **`npm run lint:root`** — lints the top-level `scripts/` helper code.
3. **`npm run format:check`** — Prettier (v3) must report zero unformatted files.
4. **`npm run typecheck`** — `tsc --noEmit` over the backend TypeScript helpers.
5. **`npm run verify:repo`** — sanity-checks the repo structure.
6. **`npm test`** — Jest backend plus all three CRA test runners.
7. **`npm run build`** — creates optimized production bundles for the three
   React applications. The plain-JavaScript Express API has no compile step.

Use `npm run build:web` to build the same bundles, or `npm run verify:build` as the
build-only entry point when iterating locally.

## Formatting

```bash
npm run format            # writes Prettier changes everywhere
npm run format:check      # CI reads this; fails on any unformatted file
```

The active style lives in `.prettierrc.json` (root for tooling/scripts and
shared via each package for source). Do **not** commit unformatted code — CI will
reject it.

## Testing

- **Backend** — Jest + `mongodb-memory-server` + `supertest`. No external Mongo
  required locally. Run `npm run test:coverage` to generate a coverage report in
  `backend/coverage/`. See `docs/testing.md` for the full guide.
- **React apps** — Jest via `react-scripts test`. Run `npm run test:ci` for the
  CI-equivalent (non-watch) run.

## Commits

This repository uses [Conventional Commits](https://www.conventionalcommits.org/).
The `lint:commits` command validates the most recent local commit, and the
`commitlint.yml` workflow validates every commit introduced by a pull request
and every new commit pushed to `main` or `develop`:

```
<type>[optional scope]: <description>

[optional body]
[optional footer(s)]
```

| Type       | When to use                |
| ---------- | -------------------------- |
| `feat`     | A new feature              |
| `fix`      | A bug fix                  |
| `docs`     | Documentation only         |
| `style`    | Tooling, style, formatting |
| `refactor` | Production code refactor   |
| `test`     | Adding/fixing tests        |
| `chore`    | Maintenance, dependencies  |

Keep commits focused; one logical change per commit.

## Pull requests

1. Branch from `develop` (open a PR to `develop`; `main` is reserved for
   releases).
2. Keep PRs small and include tests for any behaviour change.
3. CI must be green on the PR before merge.
4. Squash-and-merge is **not** used — we preserve the commit history.

## Reporting issues

Open a GitHub issue and include:

- A clear title and description of the bug/feature.
- Steps to reproduce (for bugs).
- Your Node/npm versions (`node -v`, `npm -v`).
