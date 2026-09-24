#!/usr/bin/env node
'use strict';

/**
 * Coverage gate.
 *
 * Reads the `json-summary` report Jest writes to `coverage/coverage-summary.json`
 * and fails when a covered area drops below its floor. Two rules make this more
 * than a number check:
 *
 *   1. Floors are per area, not only global. A global average hides the case
 *      where the module that carries the business rules has no tests at all.
 *   2. A floor declared for a file that no longer reports coverage is a failure.
 *      Otherwise renaming or deleting a file would silently remove its gate.
 *
 * Floors sit just below the numbers measured when they were introduced: green
 * today, red the moment someone deletes a test. Ratchet them upward as modules
 * gain coverage — never lower them to make a build pass.
 */

const fs = require('fs');
const path = require('path');

const SUMMARY_PATH = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');

const METRICS = ['statements', 'branches', 'functions', 'lines'];

/**
 * Minimum percentage per area, keyed by path relative to `backend/`, plus the
 * special `global` key for the whole project.
 */
const FLOORS = {
  global: { statements: 60, branches: 65, functions: 55, lines: 60 },
  'controllers/tour.js': { statements: 70, branches: 55, functions: 55, lines: 70 },
  'services/tour.service.js': { statements: 90, branches: 75, functions: 90, lines: 90 },
  'validators/tour.validator.js': { statements: 85, branches: 75, functions: 90, lines: 85 },
  'middleware/errorHandler.js': { statements: 90, branches: 85, functions: 95, lines: 90 },
  'middleware/asyncHandler.js': { statements: 95, branches: 95, functions: 95, lines: 95 },
  'middleware/notFound.js': { statements: 95, branches: 95, functions: 95, lines: 95 },
  'middleware/requestId.js': { statements: 95, branches: 95, functions: 95, lines: 95 },
  'middleware/rateLimit.js': { statements: 85, branches: 45, functions: 45, lines: 85 },
  'config/cors.js': { statements: 80, branches: 60, functions: 80, lines: 80 },
  'utils/errors.js': { statements: 95, branches: 90, functions: 95, lines: 95 },
};

/**
 * Jest keys its summary by absolute path (`D:\...\backend\services\x.js`) and
 * calls the project total `total`. Turn that into `{ global, 'services/x.js' }`
 * so the floors can be written the way a human reads the repository.
 */
function normalizeSummary(summary) {
  const normalized = {};

  for (const [key, value] of Object.entries(summary)) {
    if (key === 'total') {
      normalized.global = value;
      continue;
    }

    const unixPath = key.replace(/\\/g, '/');
    const marker = '/backend/';
    const index = unixPath.lastIndexOf(marker);
    normalized[index >= 0 ? unixPath.slice(index + marker.length) : unixPath] = value;
  }

  return normalized;
}

/**
 * Compare a normalised coverage summary against the floors.
 * Returns { failures, unknown } so the caller (or a test) can decide.
 */
function evaluate(summary, floors = FLOORS) {
  const failures = [];
  const unknown = [];

  for (const [area, floor] of Object.entries(floors)) {
    const entry = summary[area];
    if (!entry) {
      unknown.push(area);
      continue;
    }

    for (const metric of METRICS) {
      const minimum = floor[metric];
      if (minimum === undefined) continue;

      const actual = entry[metric] && entry[metric].pct;
      if (typeof actual !== 'number' || actual < minimum) {
        failures.push(
          `${area}: ${metric} ${actual === undefined ? 'n/a' : `${actual}%`} < ${minimum}%`
        );
      }
    }
  }

  return { failures, unknown };
}

function readSummary(summaryPath = SUMMARY_PATH) {
  if (!fs.existsSync(summaryPath)) {
    throw new Error(
      `missing ${summaryPath} — run "npm run test:coverage" first (the json-summary reporter writes it)`
    );
  }
  return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
}

function main() {
  const { failures, unknown } = evaluate(normalizeSummary(readSummary()));

  for (const area of unknown) {
    process.stderr.write(`check-coverage: no coverage reported for ${area} (floor is stale)\n`);
  }
  for (const failure of failures) {
    process.stderr.write(`check-coverage: ${failure}\n`);
  }

  if (failures.length > 0 || unknown.length > 0) {
    process.exit(1);
  }

  process.stdout.write(`check-coverage: ok (${Object.keys(FLOORS).length} areas above floor)\n`);
}

module.exports = { evaluate, normalizeSummary, readSummary, FLOORS, SUMMARY_PATH };

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`check-coverage: ${error.message}\n`);
    process.exit(1);
  }
}
