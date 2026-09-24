'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Environment drift guard.
 *
 * A variable that the code reads but nobody documents is a deployment trap: the
 * service boots, then fails at the first request that needs it. Every
 * `process.env.X` in the backend must be answerable from `backend/.env.example`.
 */

const backendRoot = path.resolve(__dirname, '..', '..', '..');
const repoRoot = path.resolve(backendRoot, '..');
const WEB_APPS = ['frontend', 'admin', 'tourcompanydashboard'];

// Provided by the runtime, create-react-app or the CI platform; not deployment
// configuration.
const PLATFORM_VARS = new Set(['NODE_ENV', 'PATH', 'CI', 'VERCEL', 'TZ', 'PUBLIC_URL']);

function sourceFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'coverage' || entry.name.startsWith('.')) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'tests') continue;
      sourceFiles(full, files);
    } else if (entry.name.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

function referencedEnvVars() {
  const found = new Map();

  for (const file of sourceFiles(backendRoot)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) {
      if (!found.has(match[1])) {
        found.set(match[1], path.relative(backendRoot, file));
      }
    }
  }

  return found;
}

function documentedEnvVars(templatePath) {
  const template = fs.readFileSync(templatePath, 'utf8');
  const documented = new Set();

  for (const line of template.split(/\r?\n/)) {
    const match = line.match(/^#?\s*([A-Z][A-Z0-9_]*)=/);
    if (match) documented.add(match[1]);
  }

  return documented;
}

function craSourceFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      craSourceFiles(full, files);
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function craReferencedEnvVars(app) {
  const found = new Map();

  for (const file of craSourceFiles(path.join(repoRoot, app, 'src'))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) {
      if (!found.has(match[1])) {
        found.set(match[1], path.relative(repoRoot, file));
      }
    }
  }

  return found;
}

describe('environment template contract', () => {
  const backendTemplate = path.join(backendRoot, '.env.example');

  test('every environment variable the backend reads is documented', () => {
    const documented = documentedEnvVars(backendTemplate);
    const missing = [...referencedEnvVars()]
      .filter(([name]) => !documented.has(name) && !PLATFORM_VARS.has(name))
      .map(([name, file]) => `${name} (used in ${file})`);

    expect(missing).toEqual([]);
  });

  test('the integration-test override is documented with a local placeholder', () => {
    const template = fs.readFileSync(backendTemplate, 'utf8');

    // The suite starts its own mongodb-memory-server when the variable is
    // empty, so a fresh clone never needs Docker — but the override that points
    // at `docker-compose.test.yml` has to be discoverable.
    expect(template).toMatch(/^MONGODB_URI_TEST=mongodb:\/\/127\.0\.0\.1:27017\//m);
  });

  test('the template never contains a real secret', () => {
    const template = fs.readFileSync(backendTemplate, 'utf8');

    // Placeholders only: no long random-looking values assigned to secrets.
    expect(template).not.toMatch(/JWT_SECRET=(?!your_)[A-Za-z0-9+/=]{24,}/);
    expect(template).not.toMatch(/API_SECRET=(?!your_)[A-Za-z0-9+/=]{24,}/);
    expect(template).toMatch(/SEED_ENABLED=false/);
  });
});

describe('web app environment templates', () => {
  for (const app of WEB_APPS) {
    test(`${app} documents every process.env variable its source reads`, () => {
      const documented = documentedEnvVars(path.join(repoRoot, app, '.env.example'));
      const missing = [...craReferencedEnvVars(app)]
        .filter(([name]) => !documented.has(name) && !PLATFORM_VARS.has(name))
        .map(([name, file]) => `${name} (used in ${file})`);

      expect(missing).toEqual([]);
    });
  }

  test('the storefront documents both names of the Places API key', () => {
    const template = fs.readFileSync(path.join(repoRoot, 'frontend', '.env.example'), 'utf8');

    expect(template).toMatch(/^PLACES_API_KEY=$/m);
    expect(template).toMatch(/^REACT_APP_PLACES_API_KEY=$/m);
  });
});
