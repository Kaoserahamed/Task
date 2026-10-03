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

### Every feature or bugfix ships with a test

**A change to production source must include a change to a test file in the same
commit.** This is a required checklist item for every pull request, and CI
enforces it: `scripts/verify-test-pairing.mjs` inspects the commit range and
fails when `backend/`, `frontend/src/`, `admin/src/` or
`tourcompanydashboard/src/` source changes with no `*.test.js` / `*.test.jsx`
in the same range.

```bash
npm run verify:tests-paired                      # the most recent commit
npm run verify:tests-paired <from> <to>          # a range
npm run verify:tests-paired -- --staged          # before you commit
```

When a change is paired, prefer extending an existing test file over adding a
new one, and add a new test file when the code is a new module.

The check exempts changes that contain no production source at all
(documentation, CI configuration, stylesheets) and these files, which no unit
test reasonably owns: `index.js`, `setupTests.js`, `reportWebVitals.js`, story
files, `*.d.ts`, and test files themselves.

If a commit genuinely needs no test — a pure rename, a comment-only fix, a
generated file — set `TEST_PAIRING_EXEMPT` with the reason and state it in the
pull request so a reviewer can judge the exception:

```bash
TEST_PAIRING_EXEMPT="renamed WeatherSuggestion.jsx to Suggestions.jsx; no behaviour change" \
  npm run verify:tests-paired
```

## Pull requests

1. Branch from `main` and open the pull request against `main` — it is the
   repository's integration branch. `ci.yml` also accepts pulls into `develop`,
   but no `develop` branch exists in this repository, so do not target one. Name
   the branch for the work (`feat/…`, `fix/…`, `refactor/…`, `docs/…`).
2. Keep PRs small. **Every feature or bugfix must include or update a matching
   `*.test.js` / `*.test.jsx` in the same commit** — CI runs
   `npm run verify:tests-paired` over the PR range and fails without one. See
   [Every feature or bugfix ships with a test](#every-feature-or-bugfix-ships-with-a-test)
   for the exemptions and the `TEST_PAIRING_EXEMPT` escape hatch.
3. CI must be green on the PR before merge.
4. Squash-and-merge is **not** used — we preserve the commit history.

## Releases

`CHANGELOG.md` uses [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
headings and the project follows [Semantic Versioning](https://semver.org/).
Every `package.json` in the workspace carries the same `version`, and
`npm run verify:repo` fails when one drifts, so a release is a single version
bump across five manifests rather than five independent edits.

To cut a release:

1. Move the entries under `## [Unreleased]` in `CHANGELOG.md` into a new
   `## [x.y.z] - YYYY-MM-DD` heading, leaving an empty `## [Unreleased]` on top
   for the next cycle.
2. Bump `version` in the root `package.json` and in `backend/`, `frontend/`,
   `admin/` and `tourcompanydashboard/` so all five agree.
3. Land that change on `main` and wait for CI to go green — a tag is only as
   trustworthy as the commit it points at.
4. Tag that commit and push the tag:

   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

Pushing a `v*` tag is what triggers `aws-production.yml`. That workflow runs the
quality gate (`npm run verify` plus the integration suite) before it builds,
scans and pushes images and applies the Terraform plan, so **the tag is the
deploy trigger** — tag only a commit you intend to deploy. When you need to
deploy without cutting a release, dispatch the same workflow manually; it
accepts an optional `image_tag` input.

`git tag` plus the `CHANGELOG.md` history is the release record. There are no
long-lived release branches to keep in sync.

## Reporting issues

Open a GitHub issue and include:

- A clear title and description of the bug/feature.
- Steps to reproduce (for bugs).
- Your Node/npm versions (`node -v`, `npm -v`).
