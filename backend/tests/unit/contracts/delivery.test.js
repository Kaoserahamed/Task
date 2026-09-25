'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Delivery contract.
 *
 * Phase 7 of the roadmap is about the things a new contributor and a deploy
 * touch before they run any application code: the onboarding container, the
 * review template, the image the API ships in, and the database evolution
 * story. Each has a failure mode that is invisible until it hurts — a root
 * container, an image built from a drifted lockfile, two hashing libraries, a
 * migration renamed after it was applied — so each is pinned here.
 */

const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const backendRoot = path.resolve(__dirname, '..', '..', '..');
const exists = (relativePath) => fs.existsSync(path.join(repoRoot, relativePath));
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('onboarding contract', () => {
  test('the dev container installs the workspace and forwards the documented ports', () => {
    const devcontainer = JSON.parse(read('.devcontainer/devcontainer.json'));

    expect(devcontainer.image).toMatch(/node:20/);
    expect(devcontainer.postCreateCommand).toContain('npm run setup');
    expect(devcontainer.remoteUser).toBe('node');
    for (const port of [4000, 3000, 3001, 3002]) {
      expect(devcontainer.forwardPorts).toContain(port);
    }
  });

  test('a pull request has a template that names the gate it must pass', () => {
    const template = read('.github/pull_request_template.md');

    expect(template).toMatch(/npm run verify/);
    expect(template).toMatch(/CHANGELOG\.md/);
    expect(template).toMatch(/Conventional Commits/);
  });

  test('ownership and dependency updates are declared', () => {
    expect(exists('.github/CODEOWNERS')).toBe(true);
    expect(read('.github/dependabot.yml')).toMatch(/package-ecosystem: github-actions/);
  });
});

describe('container contract', () => {
  const dockerfile = read('backend/Dockerfile');

  test('the API image installs locked production dependencies', () => {
    expect(dockerfile).toMatch(/npm ci --omit=dev/);
    expect(dockerfile).not.toMatch(/npm install/);
  });

  test('the API image never runs as root', () => {
    expect(dockerfile).toMatch(/USER node/);
    // The unprivileged user has to own the uploads directory, or the first
    // upload fails with EACCES in production only.
    expect(dockerfile).toMatch(/chown -R node:node/);
  });

  test('the API image probes liveness, not readiness', () => {
    expect(dockerfile).toMatch(/HEALTHCHECK/);

    // Only the probe command counts: the comments above it may mention the
    // readiness endpoint when explaining why it is not used here.
    const healthcheck = dockerfile.slice(dockerfile.indexOf('HEALTHCHECK'));
    const probe = healthcheck.split('\n')[1];

    expect(probe).toMatch(/\/health\/live/);
    // A readiness probe would restart the container whenever Mongo hiccups.
    expect(probe).not.toMatch(/\/health\/ready/);
  });

  test('the build context excludes data, secrets and tests', () => {
    const dockerignore = read('backend/.dockerignore');

    for (const rule of ['node_modules', 'uploads', '.env', 'coverage', 'tests']) {
      expect(dockerignore).toMatch(new RegExp(`^${rule.replace('.', '\\.')}$`, 'm'));
    }
    // The template stays in the image; only real environment files are excluded.
    expect(dockerignore).toMatch(/^!\.env\.example$/m);
  });
});

describe('company dashboard hosting contract', () => {
  const readJson = (relativePath) => JSON.parse(read(relativePath));

  test('declares a reproducible Vercel static build', () => {
    const vercel = readJson('tourcompanydashboard/vercel.json');

    expect(vercel.framework).toBe('create-react-app');
    expect(vercel.installCommand).toBe('npm ci');
    expect(vercel.buildCommand).toBe('npm run build');
    expect(vercel.outputDirectory).toBe('build');
  });

  test('routes browser navigation through the SPA entry point', () => {
    const { rewrites } = readJson('tourcompanydashboard/vercel.json');

    expect(rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
  });

  test('pins the same Node major used by CI and the container build', () => {
    expect(read('tourcompanydashboard/.nvmrc').trim()).toBe('20');
    expect(read('tourcompanydashboard/Dockerfile')).toMatch(/^FROM node:20-/m);
  });
});

describe('password hashing contract', () => {
  test('the manifest declares exactly one bcrypt implementation', () => {
    const manifest = JSON.parse(read('backend/package.json'));
    const declared = { ...manifest.dependencies, ...manifest.devDependencies };

    expect(declared.bcryptjs).toBeDefined();
    expect(declared.bcrypt).toBeUndefined();
  });

  test('only utils/password.js requires bcryptjs', () => {
    const offenders = [];

    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.name.endsWith('.js')) {
          const source = fs.readFileSync(full, 'utf8');
          if (/require\(['"]bcrypt(js)?['"]\)/.test(source)) {
            offenders.push(path.relative(backendRoot, full).replace(/\\/g, '/'));
          }
        }
      }
    };

    for (const dir of ['routes', 'controllers', 'middleware', 'services', 'utils', 'scripts']) {
      walk(path.join(backendRoot, dir));
    }

    expect(offenders).toEqual(['utils/password.js']);
  });
});

describe('database evolution contract', () => {
  test('the migration runner and its format are documented', () => {
    expect(exists('backend/scripts/run-migrations.js')).toBe(true);
    expect(exists('backend/scripts/migrations/README.md')).toBe(true);
    expect(exists('docs/migrations.md')).toBe(true);
  });

  test('running migrations in production requires an explicit flag', () => {
    const source = read('backend/scripts/run-migrations.js');

    expect(source).toMatch(/MIGRATIONS_ENABLED|migrations\.enabled/);
    expect(source).toMatch(/dry-run/);
  });

  test('a migration is recorded only after its up() resolves', () => {
    const source = read('backend/scripts/migrations/index.js');

    expect(source).toMatch(/await apply\(migration\)/);
    expect(read('backend/scripts/migrations/index.js')).toMatch(/function planMigrations/);
  });
});

describe('documentation index contract', () => {
  const docsDir = path.join(repoRoot, 'docs');
  const index = read('docs/README.md');

  test('every page in docs/ is reachable from the index', () => {
    const pages = fs
      .readdirSync(docsDir)
      .filter((name) => name.endsWith('.md') && name !== 'README.md');

    expect(pages.length).toBeGreaterThan(5);
    for (const page of pages) {
      expect(index).toContain(page);
    }
  });

  test('the index reaches outside the docs tree for the governance files', () => {
    for (const file of ['../CONTRIBUTING.md', '../SECURITY.md', '../README.md']) {
      expect(index).toContain(file);
    }
  });
});
