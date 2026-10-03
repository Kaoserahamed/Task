#!/usr/bin/env node
/**
 * verify-test-pairing.mjs — require a test change alongside a source change.
 *
 * The repository has grown a large, well-tested surface, but nothing stopped a
 * feature or bugfix from landing with no test at all: 351 commits carried a
 * conventional_rate_last_200 of 0.61 while per-feature test commits did not keep
 * pace. This check makes the pairing a mechanical gate instead of a review
 * habit.
 *
 * Given a commit range it fails when a change to production source ships with no
 * change to any test file in the same range. It is dependency-free, runs offline,
 * and reads only `git diff` output, mirroring `verify-repo.mjs`.
 *
 * Usage:
 *   node scripts/verify-test-pairing.mjs [<from> [<to>]]
 *   node scripts/verify-test-pairing.mjs --staged
 *
 * With no arguments it checks the most recent commit (HEAD^..HEAD). The GitHub
 * Actions workflow passes the pull-request or push range explicitly.
 *
 * Escape hatch, for the rare commit that genuinely needs none (a rename, a
 * comment-only fix), record why in the PR description and set:
 *   TEST_PAIRING_EXEMPT="reason"
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Source that should be exercised by a test. A change to any of these without a
// test change in the same range is the failure this script exists to prevent.
const SOURCE_ROOTS = ['backend', 'frontend/src', 'admin/src', 'tourcompanydashboard/src'];

const SOURCE_EXTENSIONS = /\.(js|jsx|ts|tsx|mjs|cjs)$/;
const TEST_FILE = /\.(test|spec)\.(js|jsx|ts|tsx|mjs|cjs)$/;

// Files whose behaviour no unit test can reasonably own.
const EXEMPT_FILES = [
  // Entry points and bootstrapping: they run once, at process start.
  /(^|\/)index\.(js|jsx|ts|tsx)$/,
  /(^|\/)setupTests\.(js|jsx)$/,
  /(^|\/)reportWebVitals\.(js|jsx)$/,
  // Test files themselves.
  TEST_FILE,
  // Storybook, benchmark, and codemod-adjacent helpers.
  /\.stories\.(js|jsx)$/,
  // Declaration files carry no runtime behaviour.
  /\.d\.ts$/,
];

const EXEMPT_PATH_SEGMENTS = new Set(['coverage', 'build', 'dist', 'node_modules']);

const argv = process.argv.slice(2);

function git(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
}

function gitOrNull(args) {
  try {
    return git(args);
  } catch {
    return null;
  }
}

function resolveRange() {
  if (argv.includes('--staged')) {
    return { name: 'the staged changes', files: gitOrNull(['diff', '--cached', '--name-only']) };
  }

  const [from, to] = argv.filter((arg) => !arg.startsWith('--'));
  if (from && to) {
    return { name: `${from}..${to}`, files: gitOrNull(['diff', '--name-only', `${from}..${to}`]) };
  }
  if (from) {
    return { name: `${from}..HEAD`, files: gitOrNull(['diff', '--name-only', `${from}..HEAD`]) };
  }

  return { name: 'HEAD^..HEAD', files: gitOrNull(['diff', '--name-only', 'HEAD^..HEAD']) };
}

const toPosix = (value) => value.split('\\').join('/').trim();

const isExempt = (file) =>
  EXEMPT_FILES.some((pattern) => pattern.test(file)) ||
  file.split('/').some((segment) => EXEMPT_PATH_SEGMENTS.has(segment));

function classify(files) {
  const changed = files.split('\n').map(toPosix).filter(Boolean);

  const source = changed.filter(
    (file) =>
      SOURCE_EXTENSIONS.test(file) &&
      !isExempt(file) &&
      SOURCE_ROOTS.some((root) => file === root || file.startsWith(`${root}/`))
  );
  const tests = changed.filter((file) => TEST_FILE.test(file));

  return { source, tests };
}

const range = resolveRange();

if (range.files === null) {
  process.stdout.write(`verify-test-pairing: skipped, no comparable range for ${range.name}\n`);
  process.exit(0);
}

const { source, tests } = classify(range.files);

if (source.length === 0) {
  process.stdout.write(`verify-test-pairing: ok (${range.name}, no production source changed)\n`);
  process.exit(0);
}

if (tests.length > 0) {
  process.stdout.write(
    `verify-test-pairing: ok (${range.name}, ${source.length} source file(s) with ` +
      `${tests.length} test file(s))\n`
  );
  process.exit(0);
}

const exempt = process.env.TEST_PAIRING_EXEMPT;
if (exempt) {
  process.stdout.write(`verify-test-pairing: skipped by TEST_PAIRING_EXEMPT (${exempt})\n`);
  process.exit(0);
}

process.stderr.write(
  `verify-test-pairing: ${source.length} production source file(s) changed in ` +
    `${range.name} with no test file in the same change:\n`
);
for (const file of source) {
  process.stderr.write(`  - ${file}\n`);
}
process.stderr.write(
  'Add or update a matching *.test.js / *.test.jsx in this change, or set\n' +
    'TEST_PAIRING_EXEMPT with the reason and explain it in the pull request.\n'
);
process.exit(1);
