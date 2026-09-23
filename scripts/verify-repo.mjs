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

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const STACKS = ['backend', 'frontend', 'admin', 'tourcompanydashboard'];

const REQUIRED_SCRIPTS = [
  'setup',
  'test',
  'test:backend',
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

// 3. The entry points a fresh clone needs are actually declared.
for (const script of REQUIRED_SCRIPTS) {
  if (!root.scripts || !root.scripts[script]) {
    fail(`root package.json is missing the "${script}" script`);
  }
}

// 4. Every stack pins the runtime CI and the containers use.
for (const stack of ['', ...STACKS]) {
  const manifestPath = stack === '' ? 'package.json' : `${stack}/package.json`;
  const manifest = readJson(manifestPath);
  const engines = manifest.engines && manifest.engines.node;
  if (!engines || !/>=?20/.test(engines)) {
    fail(`${manifestPath} engines.node (${engines ?? 'unset'}) must require Node 20+`);
  }
}

// 5. Runtime uploads are data, not source: .gitignore must keep them out of the
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

if (failures.length > 0) {
  for (const failure of failures) {
    process.stderr.write(`verify-repo: ${failure}\n`);
  }
  process.exit(1);
}

process.stdout.write(`verify-repo: ok (${root.name}@${root.version})\n`);
