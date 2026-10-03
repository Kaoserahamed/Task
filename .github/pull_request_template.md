<!-- Keep this short. The reviewer's first question is "why", the second is "how do I know it works". -->

## What and why

<!-- One paragraph. Link the issue or the ADR this implements. -->

## Type of change

- [ ] Fix
- [ ] Feature
- [ ] Refactor / chore
- [ ] Documentation
- [ ] Breaking change — migration described below

## How it was verified

<!--
The commands you ran, e.g.
- npm --prefix backend run test:unit
- npm --prefix backend run test:integration (needs Mongo)
- npm run verify
-->

## Checklist

- [ ] `npm run verify` passes locally (lint, format:check, typecheck, verify:repo, tests)
- [ ] New behaviour comes with a test; changed behaviour updates the existing one
- [ ] A `*.test.js` / `*.test.jsx` is included or updated in this same change
      (`npm run verify:tests-paired` enforces this in CI; use `TEST_PAIRING_EXEMPT` with a
      reason if this PR legitimately has no test)
- [ ] `CHANGELOG.md` has an entry under `[Unreleased]`
- [ ] Documentation touched by this change was updated (`README.md`, `docs/`)
- [ ] No secret, `.env` file, upload or build artifact is part of the diff
- [ ] New environment variables are declared in `backend/.env.example` (the drift test enforces this)
- [ ] Commits are Conventional Commits, one logical change each

## Notes for the reviewer

<!-- Anything that is deliberately left undone, and why. -->
