# ADR 0006 — One long-lived access token, one password hash

- **Status:** accepted
- **Date:** 2026-09-23
- **Context:** Phase 6 of the refactoring roadmap (security hardening)

## Context

Two security decisions were implicit in the code and worth writing down.

**Sessions.** Four React clients authenticate against three credential endpoints
(`/user/auth`, `/company/auth`, `/api/admin`). Each one stores a single JWT
signed with `JWT_SECRET` and sends it as `Authorization: Bearer`. There is no
refresh endpoint, no rotation and no revocation list — logging out means
dropping the token in the browser.

**Passwords.** The manifest carried both the native `bcrypt` binding and
`bcryptjs`; company accounts were hashed by one and verified by the other, at two
different cost factors, and the native binding needs a C toolchain to install.

## Decision

1. Keep **one access token per session**, with its lifetime controlled by
   `JWT_EXPIRES_IN` (default `7d`). Do not build refresh rotation now.
2. Hash and verify passwords through **`backend/utils/password.js`** only:
   `bcryptjs` at cost 10, with `hashPassword`/`verifyPassword` as the single
   entry points. The native `bcrypt` dependency is removed.

## Alternatives considered

| Alternative                                   | Why not now                                                                                                                      |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Access (15 min) + refresh token with rotation | Correct end state, but it needs rotation storage, a `jti` deny-list and client changes in four apps — a project of its own       |
| Session cookies with server-side sessions     | The clients are separate CRA deployments on different origins; cookies would need `SameSite=None` plus credentials on every call |
| Native `bcrypt` everywhere                    | Faster, but native build steps break `npm ci` on machines without a toolchain for no functional gain                             |
| `argon2`                                      | Stronger against GPU attacks, another native dependency, and the reference implementation standardises on bcryptjs               |

## Consequences

- A stolen token is usable until it expires. The mitigation is a shorter
  `JWT_EXPIRES_IN`; the real fix (refresh rotation + revocation) is listed as a
  known gap in [SECURITY.md](../../SECURITY.md#known-gaps) rather than pretended
  away.
- Cost 10 costs ~100 ms per hash and ~100 ms per login. Raising the cost is a
  one-line change in `utils/password.js`; existing hashes keep verifying, and
  re-hashing on the next successful login is the upgrade path.
- The repository guard fails if a second bcrypt implementation appears in the
  manifest or if any module other than `utils/password.js` requires one.
