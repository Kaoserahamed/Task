# Testing guide

## Philosophy

- Tests live next to the code they cover under `tests/` (backend) or alongside
  components in `src/` (React apps).
- Backend tests must **not** touch a real database — they run against an
  in-memory MongoDB provided by `mongodb-memory-server`.
- Tests are fast, deterministic, and hermetic: a green `npm test` on a fresh
  checkout is the bar for merging.

## Offline versus integration tests

The default suites are offline and do not require MongoDB, Docker, Cloudinary,
Pusher, or email credentials:

```bash
npm test                  # backend unit suite + all three React app suites
npm run build              # optimized production bundles for all three React apps
npm run test:coverage      # coverage gates for every package
```

The backend integration suite is intentionally separate. It starts a
throwaway `mongodb-memory-server` when `MONGODB_URI_TEST` is not set, so a fresh
clone does not need Docker, a live database, or an account. The first run may
download the MongoDB binary once; later runs use the local cache. To use an
existing service instead, set `MONGODB_URI_TEST` explicitly.

### Fresh-clone sequence

From a new checkout, the complete offline test path is:

```bash
git clone <repository-url>
cd Task
npm run setup
npm test
npm run build
```

`test:offline` is hermetic: it runs the backend unit suite and all React app
suites without MongoDB, Docker, Cloudinary, Pusher, or Sendinblue. The
integration suite is also account-free when its MongoDB binary is cached:

```bash
npm run test:backend:integration
```

For a real service container, use the explicit alternative:

```bash
npm run stack:test:up
$env:MONGODB_URI_TEST='mongodb://127.0.0.1:27017/task-integration'
npm run test:backend:integration
npm run stack:test:down
```

External API keys are not required by the offline unit/web suites or the
in-memory integration suite.

The default backend unit suite is configured by `backend/jest.config.js` and
`backend/tests/unit/setup-env.js`; it does not open a database connection. The
integration suite is configured separately by `backend/jest.integration.config.js`.

### Dependency health

Run `npm run dependency:check` to verify the root and all four package manifests
against their committed lockfiles. The root is intentionally tooling-only; runtime
dependencies are owned by the package that ships them. `npm run dependency:report`
prints the ownership inventory, and `npm run dependency:audit` fails on high or
critical advisories in every production dependency graph.

### Coverage

Each app now runs a real coverage command and a second, independently runnable
`coverage:check` command. The first command executes Jest with its package-level
`coverageThreshold`; the second reads the generated `coverage-summary.json` and
re-checks both the global floor and the stricter `./src/api/` floor. CI performs
both steps, so a missing report or a threshold that is only documented cannot
produce a green build.

The repository has 74 tracked test/spec files across the backend and three React
apps. The endpoint contract suites cover every exported resource function, and
`backend/tests/unit/contracts/frontend-layer.test.js` fails if a new export is
added without a corresponding contract assertion.

### Writing a new backend test

```js
jest.mock('../socket', () => ({ init: jest.fn(), getIO: () => ({ emit: jest.fn() }) }));

describe('my controller', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/route', require('../routes/route'));
  });

  test('returns 200 for a valid request', async () => {
    const res = await request(app).get('/api/route');
    expect(res.status).toBe(200);
  });
});
```

## React apps (Jest + Testing Library)

Each app ships with `@testing-library/react`, `@testing-library/jest-dom`, and
`@testing-library/user-event`. Run with `npm run test:ci` (non-watch, CI-safe).

```jsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

test('renders without crashing', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument();
});
```

## CI expectation

The GitHub Actions workflow
([`.github/workflows/ci.yml`](ci-cd.md)) runs every gate. A PR is blocked if any
of these fail:

- ESLint (errors) — backend + CRA apps
- Prettier `format:check`
- Backend Jest with coverage threshold
- CRA production build

See `docs/ci-cd.md` for how the pipeline maps to the local `npm run verify` script.
