'use strict';

const fs = require('fs');
const path = require('path');

const {
  readSummary,
  evaluate,
  normalizeSummary,
  FLOORS,
  SUMMARY_PATH,
} = require('../../../scripts/check-coverage');

/**
 * The coverage gate is itself covered: a gate nobody tests is a gate that
 * quietly stops guarding (an empty floor list would report "ok" forever).
 */

describe('coverage gate', () => {
  test('the floors file is not empty and always includes a global floor', () => {
    expect(Object.keys(FLOORS).length).toBeGreaterThan(1);
    expect(FLOORS.global).toBeDefined();
    for (const metric of ['statements', 'branches', 'functions', 'lines']) {
      expect(typeof FLOORS.global[metric]).toBe('number');
    }
  });

  test('reports nothing when every area clears its floor', () => {
    const summary = buildSummary(FLOORS, (floor) => floor + 1);

    expect(evaluate(summary, FLOORS)).toEqual({ failures: [], unknown: [] });
  });

  test('fails when an area drops below its floor', () => {
    const summary = buildSummary(FLOORS, (floor) => floor - 1);
    const { failures } = evaluate(summary, FLOORS);

    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]).toMatch(/global: statements/);
  });

  test('fails when a declared area no longer reports coverage', () => {
    const summary = {};
    const { unknown } = evaluate(summary, { 'services/gone.js': { lines: 10 } });

    expect(unknown).toEqual(['services/gone.js']);
  });

  test('treats a missing metric as a failure rather than a pass', () => {
    const summary = { global: { statements: { pct: 90 } } };
    const { failures } = evaluate(summary, { global: { lines: 90 } });

    expect(failures[0]).toMatch(/lines n\/a/);
  });

  test('reads the summary Jest writes', () => {
    expect(typeof readSummary).toBe('function');
    expect(path.basename(SUMMARY_PATH)).toBe('coverage-summary.json');
  });

  test('normalises Jest absolute paths and the project total', () => {
    const normalized = normalizeSummary({
      'D:\\repo\\backend\\services\\tour.service.js': { statements: { pct: 90 } },
      '/repo/backend/controllers/tour.js': { statements: { pct: 80 } },
      total: { statements: { pct: 70 } },
    });

    expect(Object.keys(normalized).sort()).toEqual([
      'controllers/tour.js',
      'global',
      'services/tour.service.js',
    ]);
    expect(normalized.global.statements.pct).toBe(70);
  });
});

function buildSummary(floors, adjust) {
  const summary = {};

  for (const [area, metrics] of Object.entries(floors)) {
    summary[area] = {};
    for (const [metric, value] of Object.entries(metrics)) {
      summary[area][metric] = { pct: adjust(value) };
    }
  }

  return summary;
}

describe('the coverage report is git-ignored', () => {
  test('coverage/ never lands in the repository', () => {
    const gitignore = fs.readFileSync(
      path.resolve(__dirname, '..', '..', '..', '..', '.gitignore'),
      'utf8'
    );

    expect(gitignore).toMatch(/^coverage\/$/m);
  });
});
