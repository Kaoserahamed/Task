# Development guide

## Tooling at a glance

| Concern         | Tool           | Config                                                                                                     |
| --------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| Linter          | ESLint         | `backend/eslint.config.js` (ESLint 9 flat config) for the API; `.eslintrc.cjs` (ESLint 8) for each CRA app |
| Formatter       | Prettier 3     | `.prettierrc.json` + `.prettierignore` (root); mirrored in each package                                    |
| TypeScript      | `tsc --noEmit` | `backend/tsconfig.json` (API only; React apps remain JS)                                                   |
| Package manager | npm 10         | lockfiles committed in every workspace                                                                     |

## Installing everything

```bash
npm run setup
```

…or, per package:

```bash
cd backend && npm ci
cd ../frontend && npm ci
cd ../admin && npm ci
cd ../tourcompanydashboard && npm ci
```

`npm ci` is used for CI parity — it fails if the lockfile is out of sync with
`package.json`. After adding a dependency, run `npm install <pkg>`, commit the
updated `package.json` **and** `package-lock.json`, then run `npm run
lint:fix` and `npm run format` before pushing.

## Dev container (zero-install onboarding)

`.devcontainer/devcontainer.json` gives you Node 20, Docker-in-Docker (for
`docker compose`), the GitHub CLI and the ESLint/Prettier/MongoDB extensions in
one click — locally in VS Code via _Dev Containers: Reopen in Container_, or in
a Codespace. It runs `npm run setup` on creation and forwards the ports the rest
of this guide uses:

| Port  | What                    |
| ----- | ----------------------- |
| 4000  | API (`backend/`)        |
| 3000  | Customer storefront     |
| 3001  | Admin dashboard         |
| 3002  | Tour-company dashboard  |
| 27017 | MongoDB (compose stack) |

Inside the container the database is the compose one, so the shortest path to a
running API is:

```bash
cp backend/.env.example backend/.env    # set JWT_SECRET and MONGODB_URI
docker compose up -d mongo
npm --prefix backend run dev
```

## Scripts reference (run from the package directory)

### Backend (`backend/`)

| Script                    | What it does                |
| ------------------------- | --------------------------- |
| `start`                   | `node index.js`             |
| `dev`                     | `nodemon index.js`          |
| `lint` / `lint:fix`       | ESLint (flat config)        |
| `format` / `format:check` | Prettier over `backend/`    |
| `typecheck`               | `tsc --noEmit`              |
| `test`                    | Jest, unit suite only       |
| `test:integration`        | Jest against a real MongoDB |
| `test:coverage`           | Jest with coverage + floors |
| `verify-env`              | Validates required env vars |

Operator commands (`node scripts/...`) are listed in
[`backend/scripts/README.md`](../backend/scripts/README.md); database changes go
through [`scripts/run-migrations.js`](../backend/scripts/run-migrations.js) — see
[migrations.md](migrations.md).

### React apps (`frontend/`, `admin/`, `tourcompanydashboard/`)

| Script                    | What it does                                             |
| ------------------------- | -------------------------------------------------------- |
| `start`                   | CRA dev server                                           |
| `build`                   | Production build                                         |
| `lint` / `lint:fix`       | ESLint 8 (legacy config, `ESLINT_USE_FLAT_CONFIG=false`) |
| `format` / `format:check` | Prettier                                                 |
| `test`                    | `react-scripts test` (watch)                             |
| `test:ci`                 | `react-scripts test --watchAll=false`                    |
| `test:coverage`           | CRA test with coverage                                   |

## Running everything from the root

The root `package.json` composes the per-package scripts:

```bash
npm run lint        # lint backend + all three CRA apps
npm run test                # backend + CRA tests (CI mode)
npm run test:offline         # explicit no-database test path
npm run test:coverage
npm run format:check
npm run verify      # lint + format + typecheck + verify:repo + test
```

`npm run test:offline` is the hermetic path: it runs the backend unit suite and
all three web suites with no database, no Docker and no external account, so a
fresh clone that only copied the `.env.example` placeholders can execute it
immediately. The separate integration suite starts a throwaway
`mongodb-memory-server` unless `MONGODB_URI_TEST` points somewhere else — see
[testing.md](testing.md).

## Environment variables

- **Backend** — copy `backend/.env.example` to `backend/.env` and fill in the
  keys. At minimum set `JWT_SECRET`, `MONGODB_URI`, and any Cloudinary / mail
  credentials. `npm run verify-env` checks them. The root `.env.example` is an
  index for the four application-local templates.
- **React apps** — CRA variables must be prefixed with `REACT_APP_`. The CI
  workflow supplies `REACT_APP_API_URL=http://localhost:4000` for builds.
