'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Frontend layering contract.
 *
 * The three React apps must speak HTTP through exactly one door: `src/api/`.
 * A component that calls `fetch` or imports `axios` again silently reintroduces
 * the problem the refactor removed — a second base-URL convention, a second
 * bearer-token header, a second error shape — and none of that shows up until
 * a request fails in production. The same layer must stay tested, so every
 * manifest carries coverage floors that make `npm run test:coverage` a gate.
 */

const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const WEB_APPS = ['frontend', 'admin', 'tourcompanydashboard'];
// The Google Places page talks to the dev-server /proxy route, not our API.
const API_LAYER_EXEMPTIONS = new Set(['frontend/src/Pages/Places.js']);

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));

function listSourceFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'Assets') continue;
      out.push(...listSourceFiles(full));
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('frontend API layer contract', () => {
  for (const app of WEB_APPS) {
    describe(app, () => {
      test('has the single HTTP client', () => {
        expect(fs.existsSync(path.join(repoRoot, app, 'src', 'api', 'client.js'))).toBe(true);
      });

      test('no component speaks HTTP on its own', () => {
        const offenders = listSourceFiles(path.join(repoRoot, app, 'src'))
          .map((file) => path.relative(repoRoot, file).split(path.sep).join('/'))
          .filter((relative) => !relative.split('/').includes('api'))
          .filter((relative) => !API_LAYER_EXEMPTIONS.has(relative))
          .filter((relative) => {
            const source = fs.readFileSync(path.join(repoRoot, relative), 'utf8');
            return /(^|[^.\w])fetch\s*\(/.test(source) || /from\s+['"]axios['"]/.test(source);
          });

        expect(offenders).toEqual([]);
      });

      test('uses production-compatible React imports', () => {
        // React 18's CommonJS entry point has no static named `React` export.
        // Jest's transform tolerates it, but the CRA production bundler rejects
        // it, so keep JSX on the default import understood by both paths.
        const offenders = listSourceFiles(path.join(repoRoot, app, 'src'))
          .map((file) => path.relative(repoRoot, file).split(path.sep).join('/'))
          .filter((relative) => {
            const source = fs.readFileSync(path.join(repoRoot, relative), 'utf8');
            return /import\s*\{[^}]*\bReact\b[^}]*\}\s*from\s*['"]react['"]/.test(source);
          });

        expect(offenders).toEqual([]);
      });

      test('carries no HTTP client library', () => {
        const manifest = readJson(`${app}/package.json`);
        expect((manifest.dependencies || {}).axios).toBeUndefined();
      });

      test('reads the API URL from the one config module', () => {
        // A second copy of `process.env.REACT_APP_API_URL || '...'` is how the
        // socket and the REST client drift: one gets the deploy-time value, the
        // other keeps a localhost default, and only one of them connects.
        const offenders = listSourceFiles(path.join(repoRoot, app, 'src'))
          .map((file) => path.relative(repoRoot, file).split(path.sep).join('/'))
          .filter((relative) => relative !== `${app}/src/config/api.js`)
          .filter((relative) => {
            const source = fs.readFileSync(path.join(repoRoot, relative), 'utf8');
            return /process\.env\.REACT_APP_API_URL/.test(source);
          });

        expect(offenders).toEqual([]);
      });

      test('typechecks the API layer', () => {
        // `tsconfig.json` leaves checkJs off for the legacy component trees, so
        // the client opts in per file. Without the pragma the `typecheck` script
        // would parse every source file and report nothing at all — a gate that
        // looks green because it checks nothing is worse than no gate.
        const tsconfig = readJson(`${app}/tsconfig.json`);
        expect(tsconfig.include).toContain('src');
        expect(tsconfig.compilerOptions.allowJs).toBe(true);

        const client = fs.readFileSync(path.join(repoRoot, app, 'src', 'api', 'client.js'), 'utf8');
        expect(client).toMatch(/^\/\/ @ts-check/m);

        const { scripts } = readJson(`${app}/package.json`);
        expect(scripts.typecheck).toBe('tsc --noEmit');
      });

      test('logs through the logger façade, never console directly', () => {
        // Debug leftovers used to ship to end users and print tokens and chat
        // payloads into the browser console. `no-console` in each app's ESLint
        // config is the live gate; this test is the one that keeps the façade
        // itself honest, so a renamed or deleted logger cannot silently leave
        // the whole app unmediated.
        const loggerPath = `${app}/src/utils/logger.js`;
        expect(fs.existsSync(path.join(repoRoot, loggerPath))).toBe(true);

        const offenders = listSourceFiles(path.join(repoRoot, app, 'src'))
          .map((file) => path.relative(repoRoot, file).split(path.sep).join('/'))
          .filter((relative) => relative !== loggerPath)
          .filter((relative) => {
            const source = fs.readFileSync(path.join(repoRoot, relative), 'utf8');
            return /(^|[^.\w])console\s*\./.test(source);
          });

        expect(offenders).toEqual([]);
      });

      test('declares the no-console rule that enforces the façade', () => {
        const eslintConfig = fs.readFileSync(path.join(repoRoot, app, '.eslintrc.cjs'), 'utf8');
        expect(eslintConfig).toMatch(/'no-console':\s*'error'/);
      });

      test('contains root render failures in privacy-safe optional monitoring', () => {
        const manifest = readJson(`${app}/package.json`);
        const sourceRoot = path.join(repoRoot, app, 'src');
        const entry = fs.readFileSync(path.join(sourceRoot, 'index.js'), 'utf8');
        const monitoring = fs.readFileSync(path.join(sourceRoot, 'monitoring.js'), 'utf8');
        const boundaryName = app === 'admin' ? 'components' : 'Components';
        const boundary = fs.readFileSync(
          path.join(sourceRoot, boundaryName, 'ui', 'AppErrorBoundary.jsx'),
          'utf8'
        );

        expect(manifest.dependencies['@sentry/react']).toBe('^11.0.0');
        expect(entry).toContain('initializeMonitoring()');
        expect(entry).toContain('<AppErrorBoundary>');
        expect(monitoring).toContain('REACT_APP_SENTRY_DSN');
        expect(monitoring).toContain('REACT_APP_RELEASE');
        expect(monitoring).toMatch(/sendDefaultPii:\s*false/);
        expect(boundary).toContain("from '@sentry/react'");
        expect(boundary).toContain('resetError');
        expect(boundary).toContain('eventId');
      });

      test('declares coverage collection and floors', () => {
        const manifest = readJson(`${app}/package.json`);
        const { jest } = manifest;
        expect(Array.isArray(jest.collectCoverageFrom)).toBe(true);
        expect(jest.collectCoverageFrom).toContain('src/**/*.{js,jsx}');
        expect(jest.coverageThreshold.global).toBeDefined();
        expect(jest.coverageThreshold['./src/api/']).toBeDefined();
        expect(jest.coverageReporters).toContain('json-summary');
        expect(manifest.scripts['coverage:check']).toBe('node ../scripts/check-web-coverage.mjs');
      });

      test('every exported resource function has an endpoint contract assertion', () => {
        const apiDir = path.join(repoRoot, app, 'src', 'api');
        const endpointTest = fs.readFileSync(path.join(apiDir, 'endpoints.test.js'), 'utf8');
        const missing = [];

        for (const entry of fs.readdirSync(apiDir)) {
          if (!entry.endsWith('.js') || entry === 'client.js' || entry.endsWith('.test.js')) {
            continue;
          }
          const source = fs.readFileSync(path.join(apiDir, entry), 'utf8');
          const moduleName = entry.replace(/\.js$/, '');
          const exports = [...source.matchAll(/export\\s+(?:const|function)\\s+(\\w+)/g)].map(
            (match) => match[1]
          );
          for (const exportedName of exports) {
            if (
              !new RegExp(`\\\\b${moduleName}\\\\.${exportedName}\\\\s*\\\\(`).test(endpointTest)
            ) {
              missing.push(`${moduleName}.${exportedName}`);
            }
          }
        }

        expect(missing).toEqual([]);
      });
    });
  }

  test('the repo guard enforces the same rule', () => {
    const guard = fs.readFileSync(path.join(repoRoot, 'scripts', 'verify-repo.mjs'), 'utf8');
    expect(guard).toMatch(/src\/api\/client\.js/);
    expect(guard).toMatch(/collectCoverageFrom/);
    expect(guard).toMatch(/coverageThreshold/);
    // A build context that ignores `.env*` is what keeps a real API URL or key
    // out of the published image; the guard checks every app ships one.
    for (const app of WEB_APPS) {
      expect(fs.existsSync(path.join(repoRoot, app, '.dockerignore'))).toBe(true);
      const ignore = fs.readFileSync(path.join(repoRoot, app, '.dockerignore'), 'utf8');
      expect(ignore).toMatch(/^\.env$/m);
    }
  });
});
