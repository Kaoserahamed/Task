# ADR 0005 — One set of gates, shared by the laptop and CI

- **Status:** Accepted
- **Date:** 2026-09-23

## Context

There was no linting, no formatting rule, no type check and one test file. CI
ran `npm test` per app and swallowed failures with `|| true`, so a red pipeline
was impossible: nothing could fail, therefore nothing was enforced. Reviewers
also argued about whitespace instead of behaviour.

## Decision

- **A root entry point.** `package.json` at the repository root declares the
  scripts a fresh clone needs (`setup`, `test`, `test:web`, `test:coverage`,
  `lint`, `format:check`, `typecheck`, `verify:repo`, `verify`) and the Node
  version (`engines`), mirrored by `.nvmrc`.
- **`npm run verify` is the definition of green.** It runs lint, the root-script
  lint, Prettier's check, `tsc --noEmit` over the backend, the repository guard
  and every hermetic test suite — the same steps CI runs, in the same order.
- **One tool per job.** ESLint 9 (flat config) for the backend, ESLint 8 with
  the `react-app` shareable config for the three CRA apps (they still ship
  ESLint 8 through `react-scripts`), Prettier 3 for formatting with
  `eslint-config-prettier` last so the two never disagree.
- **Type safety where it pays.** `tsc --noEmit` with `checkJs` covers the backend
  JavaScript; the React apps rely on lint plus tests until they migrate off CRA.
- **Drift guards instead of tribal knowledge.** `scripts/verify-repo.mjs`
  checks the layout a fresh clone depends on, and the contract tests under
  `backend/tests/unit/contracts` assert the workflow, the env template and the
  directory layout keep the promised shape.
- **CI mirrors, never invents.** `.github/workflows/ci.yml` installs with
  `npm ci`, runs the same commands per stack, uploads the coverage report,
  audits dependencies at `--audit-level=high`, and adds a `fresh-clone` job that
  runs `npm run setup` + `verify:repo` to prove the documented path works from
  scratch.

## Consequences

- "It passes locally" and "it passes in CI" mean the same thing; the usual
  escape hatches (`|| true`, `--force`) are absent on purpose.
- Adding a gate means adding it to both the root script and the workflow, and
  the contract test will fail if the workflow loses one.
- Cost: prettier rewrote large parts of the codebase once (a dedicated,
  behaviour-neutral commit), and the CRA apps carry a second ESLint version
  until they leave CRA.

## Alternatives considered

- **Turbo/Nx for the monorepo** — real benefits at ten packages; at four, the
  npm workspaces-free `--prefix` scripts are easier to read and add no
  dependency.
- **Pre-commit hooks (Husky) for everything** — hooks are optional locally and
  easily bypassed; the same checks belong in CI, where they are not.
