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

      test('carries no HTTP client library', () => {
        const manifest = readJson(`${app}/package.json`);
        expect((manifest.dependencies || {}).axios).toBeUndefined();
      });

      test('declares coverage collection and floors', () => {
        const { jest } = readJson(`${app}/package.json`);
        expect(Array.isArray(jest.collectCoverageFrom)).toBe(true);
        expect(jest.collectCoverageFrom).toContain('src/**/*.{js,jsx}');
        expect(jest.coverageThreshold.global).toBeDefined();
        expect(jest.coverageThreshold['./src/api/']).toBeDefined();
      });
    });
  }

  test('the repo guard enforces the same rule', () => {
    const guard = fs.readFileSync(path.join(repoRoot, 'scripts', 'verify-repo.mjs'), 'utf8');
    expect(guard).toMatch(/src\/api\/client\.js/);
    expect(guard).toMatch(/collectCoverageFrom/);
    expect(guard).toMatch(/coverageThreshold/);
  });
});
