# Testing guide

## Philosophy

- Tests live next to the code they cover under `tests/` (backend) or alongside
  components in `src/` (React apps).
- Backend tests must **not** touch a real database — they run against an
  in-memory MongoDB provided by `mongodb-memory-server`.
- Tests are fast, deterministic, and hermetic: a green `npm test` on a fresh
  checkout is the bar for merging.

## Backend (Jest)

Configuration: `backend/jest.config.js`, setup: `backend/tests/setup.js`.

The setup file spins up an in-memory Mongo, connects Mongoose, wipes collections
between tests, and tears Mongo down in `afterAll`. The suite uses `supertest` to
exercise the Express app end-to-end through the controller + route layers.

```bash
cd backend
npm test                  # jest --runInBand
npm run test:coverage     # with a coverage report in coverage/
```

`mongodb-memory-server` downloads its own `mongod` binary on first run (cached in
`node_modules/.cache`). On CI (Linux) the download happens automatically; locally
on Windows ensure the binary can be fetched (see `.nvmrc` + Node ≥ 20).

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
