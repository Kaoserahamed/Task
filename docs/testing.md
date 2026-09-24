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
npm run test:coverage    # coverage gates for every package
```

The backend integration suite is intentionally separate. It either starts a
throwaway `mongodb-memory-server` (first run may download MongoDB) or uses the
explicit `MONGODB_URI_TEST` service when one is already running:

```bash
# In-memory integration database
npm --prefix backend run test:integration

# Or the Docker Compose MongoDB service
npm run stack:test:up
$env:MONGODB_URI_TEST='mongodb://127.0.0.1:27017/task-integration'
npm --prefix backend run test:integration
npm run stack:test:down
```

External API keys are not required by either suite: unit tests mock those
boundaries, and the integration suite is concerned with the API/database contract.

The default backend unit suite is configured by `backend/jest.config.js` and
`backend/tests/unit/setup-env.js`; it does not open a database connection. The
integration suite is configured separately by `backend/jest.integration.config.js`.

### Coverage

`test:coverage` writes `backend/coverage/lcov-report/index.html`. The
`jest.config.js` declares `collectCoverageFrom` and `coverageThreshold`
**global** floors; CI runs `--coverage` so a regression in coverage fails the
build. Ratchet thresholds upward when a new area is brought under test — never
turn the gate off.

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
