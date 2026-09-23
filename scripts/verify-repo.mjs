#!/usr/bin/env node
/**
 * verify-repo.mjs — hermetic repository-level drift guard.
 *
 * Runs with plain Node (no dependencies, no network, no database): it proves
 * the monorepo layout that the README and CI rely on is intact — every
 * `package.json` version agrees, every lockfile matches its manifest, and the
 * root entry points a fresh clone needs are present.
 *
 * Covered by CI (the `fresh-clone` job runs it via `npm run verify:repo`).
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const STACKS = ['backend', 'frontend', 'admin', 'tourcompanydashboard'];

const REQUIRED_SCRIPTS = [
  'setup',
  'test',
  'test:backend',
  'test:backend:integration',
  'test:coverage',
  'test:web',
  'lint',
  'format:check',
  'verify:repo',
  'verify',
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

// 1. Every manifest declares the same version as the root.
const root = readJson('package.json');
for (const stack of STACKS) {
  const manifest = readJson(`${stack}/package.json`);
  if (manifest.version !== root.version) {
    fail(`${stack}/package.json version ${manifest.version} != root ${root.version}`);
  }
}

// 2. Every manifest has a matching, committed lockfile.
for (const stack of ['', ...STACKS]) {
  const manifestPath = stack === '' ? 'package.json' : `${stack}/package.json`;
  const lockfilePath = stack === '' ? 'package-lock.json' : `${stack}/package-lock.json`;
  const manifest = readJson(manifestPath);

  if (!existsSync(path.join(repoRoot, lockfilePath))) {
    fail(`missing ${lockfilePath}`);
    continue;
  }

  const lock = readJson(lockfilePath);
  if (lock.name !== manifest.name || lock.version !== manifest.version) {
    fail(
      `${lockfilePath} describes ${lock.name}@${lock.version}, expected ${manifest.name}@${manifest.version}`
    );
  }
}

// 3. Every declared dependency must exist in the lockfile: a manifest that
//    drifts ahead of its lock breaks `npm ci` on a fresh clone and in CI.
for (const stack of ['', ...STACKS]) {
  const manifestPath = stack === '' ? 'package.json' : `${stack}/package.json`;
  const lockfilePath = stack === '' ? 'package-lock.json' : `${stack}/package-lock.json`;
  if (!existsSync(path.join(repoRoot, lockfilePath))) {
    continue;
  }

  const manifest = readJson(manifestPath);
  const lock = readJson(lockfilePath);
  const locked = {
    ...((lock.packages && lock.packages[''] && lock.packages[''].dependencies) || {}),
    ...((lock.packages && lock.packages[''] && lock.packages[''].devDependencies) || {}),
  };

  for (const name of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })) {
    if (!(name in locked)) {
      fail(`${lockfilePath} is missing "${name}" declared in ${manifestPath} — npm ci would fail`);
    }
  }
}

// 4. The entry points a fresh clone needs are actually declared.
for (const script of REQUIRED_SCRIPTS) {
  if (!root.scripts || !root.scripts[script]) {
    fail(`root package.json is missing the "${script}" script`);
  }
}

// 5. Every stack pins the runtime CI and the containers use.
for (const stack of ['', ...STACKS]) {
  const manifestPath = stack === '' ? 'package.json' : `${stack}/package.json`;
  const manifest = readJson(manifestPath);
  const engines = manifest.engines && manifest.engines.node;
  if (!engines || !/>=?20/.test(engines)) {
    fail(`${manifestPath} engines.node (${engines ?? 'unset'}) must require Node 20+`);
  }
}

// 6. Runtime uploads are data, not source: .gitignore must keep them out of the
//    repository while the directories themselves stay clone-able via .gitkeep.
const gitignore = readFileSync(path.join(repoRoot, '.gitignore'), 'utf8');
for (const rule of [
  'backend/uploads/*',
  '!backend/uploads/.gitkeep',
  'backend/public/uploads/*',
  '!backend/public/uploads/.gitkeep',
]) {
  if (!gitignore.includes(rule)) {
    fail(`.gitignore is missing the "${rule}" rule`);
  }
}
for (const keep of ['backend/uploads/.gitkeep', 'backend/public/uploads/.gitkeep']) {
  if (!existsSync(path.join(repoRoot, keep))) {
    fail(`missing ${keep} — the uploads directory would not survive a clone`);
  }
}

// 7. The delivery files a contributor and GitHub Actions rely on are present and
//    consistent: onboarding (dev container), review (PR template), ownership and
//    the versioned database story.
for (const relativePath of [
  '.github/CODEOWNERS',
  '.github/dependabot.yml',
  '.github/pull_request_template.md',
  '.github/workflows/ci.yml',
  '.devcontainer/devcontainer.json',
  'backend/.dockerignore',
  'backend/scripts/migrations/README.md',
  'docs/migrations.md',
  'docs/ci-cd.md',
  'docs/operations.md',
]) {
  if (!existsSync(path.join(repoRoot, relativePath))) {
    fail(`missing ${relativePath}`);
  }
}

// 8. The API image runs unprivileged, probes itself and installs locked
//    production dependencies only.
{
  const dockerfile = readFileSync(path.join(repoRoot, 'backend', 'Dockerfile'), 'utf8');
  const expectations = [
    [/^USER node$/m, 'runs as the unprivileged node user'],
    [/^HEALTHCHECK /m, 'declares a HEALTHCHECK'],
    [/npm ci --omit=dev/, 'installs locked production dependencies'],
  ];

  for (const [pattern, what] of expectations) {
    if (!pattern.test(dockerfile)) {
      fail(`backend/Dockerfile no longer ${what}`);
    }
  }

  const dockerignore = readFileSync(path.join(repoRoot, 'backend', '.dockerignore'), 'utf8');
  for (const rule of ['node_modules', 'uploads', '.env', 'tests']) {
    if (!new RegExp(`^${rule.replace('.', '\\.')}$`, 'm').test(dockerignore)) {
      fail(`backend/.dockerignore no longer excludes ${rule}`);
    }
  }
}

// 9. Passwords are hashed by exactly one library: two implementations in the
//    manifest is how two costs (and two incompatible call sites) appear.
{
  const manifest = readJson('backend/package.json');
  const declared = { ...manifest.dependencies, ...manifest.devDependencies };

  if (!declared.bcryptjs) {
    fail('backend/package.json must declare bcryptjs');
  }
  if ('bcrypt' in declared) {
    fail('backend/package.json must not declare the native bcrypt binding next to bcryptjs');
  }
  if (!existsSync(path.join(repoRoot, 'backend', 'utils', 'password.js'))) {
    fail('missing backend/utils/password.js — hashing must have a single implementation');
  }
}

// 10. Docs own docs: every top-level page in docs/ is reachable from the index.
{
  const docsDir = path.join(repoRoot, 'docs');
  const index = readFileSync(path.join(docsDir, 'README.md'), 'utf8');

  for (const entry of readdirSync(docsDir)) {
    if (!entry.endsWith('.md') || entry === 'README.md') {
      continue;
    }
    if (!index.includes(entry)) {
      fail(`docs/${entry} is not linked from docs/README.md`);
    }
  }
}

// 11. Scripts are portable: a leading `VAR=value` prefix is a POSIX shell
//     construct that cmd.exe does not understand, so the same npm script would
//     fail on a Windows checkout. `cross-env` is the documented escape hatch and
//     is already a devDependency of the apps that need it.
for (const stack of ['', ...STACKS]) {
  const manifestPath = stack === '' ? 'package.json' : `${stack}/package.json`;
  const manifest = readJson(manifestPath);

  for (const [name, script] of Object.entries(manifest.scripts || {})) {
    if (/^[A-Z_][A-Z0-9_]*=\S*\s/.test(script)) {
      fail(`${manifestPath} script "${name}" starts with an inline env assignment — use cross-env`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stderr.write(`verify-repo: ${failure}\n`);
  }
  process.exit(1);
}

process.stdout.write(`verify-repo: ok (${root.name}@${root.version})\n`);
