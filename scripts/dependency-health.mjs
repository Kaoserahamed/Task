#!/usr/bin/env node
/**
 * Dependency health and ownership check.
 *
 * The root package is intentionally tooling-only; application dependencies are
 * owned by the four package manifests. This command makes that architecture
 * auditable instead of leaving the root manifest to imply that runtime packages
 * are missing. It is dependency-free so it runs before package installation.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageDirs = ['', 'backend', 'frontend', 'admin', 'tourcompanydashboard'];
const expectedPackageManager = 'npm@11.14.1';
const failures = [];
const inventory = [];

function fail(message) {
  failures.push(message);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function assertDependencyPolicy(label, dependencies) {
  for (const [name, range] of Object.entries(dependencies || {})) {
    if (range === '*' || range === 'latest' || /^(git|github|file|http):/i.test(range)) {
      fail(`${label}: ${name} uses non-reproducible range ${range}`);
    }
  }
}

for (const packageDir of packageDirs) {
  const label = packageDir || 'root';
  const manifestPath = path.join(packageDir, 'package.json');
  const lockPath = path.join(packageDir, 'package-lock.json');
  const manifest = readJson(manifestPath);
  const lock = readJson(lockPath);

  if (manifest.packageManager !== expectedPackageManager) {
    fail(`${manifestPath}: packageManager must be ${expectedPackageManager}`);
  }
  if (manifest.engines?.node !== '>=20') {
    fail(`${manifestPath}: engines.node must be >=20`);
  }
  if (manifest.engines?.npm !== '>=10 <12') {
    fail(`${manifestPath}: engines.npm must be >=10 <12`);
  }
  if (lock.lockfileVersion !== 3) {
    fail(`${lockPath}: lockfileVersion must be 3`);
  }

  const lockedRoot = lock.packages?.[''];
  if (!lockedRoot) fail(`${lockPath}: missing the root package entry`);
  const direct = { ...(manifest.dependencies || {}), ...(manifest.devDependencies || {}) };
  const lockedDirect = {
    ...(lockedRoot?.dependencies || {}),
    ...(lockedRoot?.devDependencies || {}),
  };
  if (
    JSON.stringify(Object.entries(direct).sort()) !==
    JSON.stringify(Object.entries(lockedDirect).sort())
  ) {
    fail(`${manifestPath}: direct dependency ranges do not match ${lockPath}`);
  }
  assertDependencyPolicy(manifestPath, manifest.dependencies);
  assertDependencyPolicy(manifestPath, manifest.devDependencies);

  inventory.push({
    package: label || 'root',
    runtime: Object.keys(manifest.dependencies || {}).length,
    development: Object.keys(manifest.devDependencies || {}).length,
    lockfile: path.relative(repoRoot, path.join(repoRoot, lockPath)),
  });
}

const report = inventory
  .map(
    ({ package: name, runtime, development, lockfile }) =>
      `${name}: ${runtime} runtime / ${development} development (${lockfile})`
  )
  .join('\n');
process.stdout.write(`Dependency inventory:\n${report}\n`);

if (process.argv.includes('--report')) {
  process.stdout.write(
    `Policy: packageManager=${expectedPackageManager}; Node >=20; npm >=10 <12; lockfile v3; no floating/git/URL dependency ranges.\n`
  );
}

if (failures.length) {
  for (const failure of failures) process.stderr.write(`dependency-health: ${failure}\n`);
  process.exit(1);
}
