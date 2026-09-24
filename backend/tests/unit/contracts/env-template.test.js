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

// Provided by the runtime or the CI platform; not deployment configuration.
const PLATFORM_VARS = new Set(['NODE_ENV', 'PATH', 'CI', 'VERCEL', 'TZ']);

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

function documentedEnvVars() {
  const template = fs.readFileSync(path.join(backendRoot, '.env.example'), 'utf8');
  const documented = new Set();

  for (const line of template.split(/\r?\n/)) {
    const match = line.match(/^#?\s*([A-Z][A-Z0-9_]*)=/);
    if (match) documented.add(match[1]);
  }

  return documented;
}

describe('environment template contract', () => {
  test('every environment variable the backend reads is documented', () => {
    const documented = documentedEnvVars();
    const missing = [...referencedEnvVars()]
      .filter(([name]) => !documented.has(name) && !PLATFORM_VARS.has(name))
      .map(([name, file]) => `${name} (used in ${file})`);

    expect(missing).toEqual([]);
  });

  test('the template never contains a real secret', () => {
    const template = fs.readFileSync(path.join(backendRoot, '.env.example'), 'utf8');

    // Placeholders only: no long random-looking values assigned to secrets.
    expect(template).not.toMatch(/JWT_SECRET=(?!your_)[A-Za-z0-9+/=]{24,}/);
    expect(template).not.toMatch(/API_SECRET=(?!your_)[A-Za-z0-9+/=]{24,}/);
    expect(template).toMatch(/SEED_ENABLED=false/);
  });
});
