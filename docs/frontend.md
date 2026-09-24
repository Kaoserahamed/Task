# Frontend applications

Three React applications ship from this repository:

| App                    | Directory               | Audience                | Port |
| ---------------------- | ----------------------- | ----------------------- | ---- |
| Customer storefront    | `frontend/`             | Travellers              | 3000 |
| Administration console | `admin/`                | Platform administrators | 3001 |
| Company dashboard      | `tourcompanydashboard/` | Tour operators          | 3002 |

All three are Create React App projects with the same conventions: ESLint via
`.eslintrc.cjs`, Prettier via `.prettierrc.json`, and the test scripts below.

## The one HTTP layer: `src/api/`

Every network call in an application goes through **`src/api/`**:

```
src/
├── api/
│   ├── client.js        # the only place fetch() is called
│   ├── auth.js          # one module per resource: the endpoints it owns
│   ├── tours.js
│   └── …                # bookings, reviews, chat, wishlist, …
├── config/api.js        # the base URL, also used for image `src` values
├── Components/          # presentational + container components
├── Pages/               # routed screens
└── Context/             # auth/tours/chat state
```

- **`client.js`** adds the bearer token from `localStorage` (`token`,
  `admin-token` or `company-token`, depending on the app), serialises JSON or
  `FormData` bodies, parses the payload, and throws an `ApiError` carrying
  `status`, `code` and `errors[]` for any non-2xx response. Transport failures
  surface as `code: 'NETWORK_ERROR'`.
- **Resource modules** (`auth.js`, `tours.js`, …) expose one function per
  endpoint and nothing else. Components import them (`import * as toursApi from
'../../api/tours'`) and never build URLs themselves.
- **`config/api.js`** stays the single source of the base URL. Components may
  still import it for `img src` values, which are not API calls.

### The rule and its guards

> Components never call `fetch` and never import `axios`.

Two automated guards keep this honest:

1. `scripts/verify-repo.mjs` (check 12) fails when any `.js`/`.jsx` file
   outside `src/api/` calls `fetch(` or imports `axios`, when an app declares
   `axios` in its manifest, or when a manifest loses its coverage config. The
   single documented exemption is `frontend/src/Pages/Places.js`, which calls
   the dev-server `/proxy` route for Google Places — not our API.
2. `backend/tests/unit/contracts/frontend-layer.test.js` asserts the same
   properties from the test suite, so a bypassed script still fails `npm test`.

## Tests and coverage floors

```bash
npm run test:web                      # all three apps, CI mode
npm --prefix frontend run test:coverage   # one app with coverage
```

Each `package.json` declares:

- `jest.collectCoverageFrom` — every `src/**/*.{js,jsx}` file counts, not only
  the ones a test happens to touch (entry points and tests are excluded);
- `jest.coverageThreshold` — two rungs:
  - a **global** floor set from the measured, honest current number; and
  - a strict floor for **`./src/api/`** (85% statements, 75% branches, 90%
    functions, 85% lines), because the HTTP layer is the part every screen
    depends on.

Raise the global floors as modules gain tests; never comment them out. The
suite layout:

- `src/api/client.test.js` — transport behaviour (token injection, serialising,
  `ApiError` mapping, 204/empty bodies, every verb);
- `src/api/endpoints.test.js` — pins the path and method of every resource
  function, so a renamed route fails a test instead of a deploy;
- page and context tests — auth flows: register mode, the admin login success
  and rejection paths, and the SPA clearing its session on a 401.

## Commands

| Command                             | Purpose                                    |
| ----------------------------------- | ------------------------------------------ |
| `npm start`                         | dev server (port 3000/3001/3002)           |
| `npm run build`                     | production bundle                          |
| `npm run lint` / `npm run lint:fix` | ESLint over `src/`                         |
| `npm run format` / `format:check`   | Prettier over `src/**/*.{js,jsx,css,json}` |
| `npm run test:ci`                   | Jest once, non-interactive                 |
| `npm run test:coverage`             | Jest with coverage floors enforced         |
| `npm run verify`                    | lint + format + tests + build              |

## Adding an endpoint

1. Add one function to the matching resource module in `src/api/` (or create
   the module if the resource is new).
2. Import it in the component or context and call it — no URLs in components.
3. Extend `src/api/endpoints.test.js` with the path and verb you expect.
4. Run `npm run verify` in the app and `npm run verify:repo` at the root.
