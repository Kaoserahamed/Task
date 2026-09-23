'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { applyMigrations, loadMigrations, planMigrations } = require('../../scripts/migrations');

/**
 * Migrations change data, so their bookkeeping has to be boring and provable:
 * ascending order, idempotent re-runs, and a loud failure when the tree and the
 * database disagree. None of that needs MongoDB — the connection only appears in
 * the two functions the CLI injects.
 */

const FIXTURES = path.join(__dirname, 'fixtures', 'migrations');
const shipped = () => loadMigrations(path.resolve(__dirname, '..', '..', 'scripts', 'migrations'));

describe('loadMigrations', () => {
  test('reads numbered files in ascending order and labels them', () => {
    const migrations = loadMigrations(FIXTURES);

    expect(migrations.map((migration) => migration.id)).toEqual(['001', '002']);
    expect(migrations[0].description).toBe('add schemaVersion to tours');
    // No description export → the slug is the label.
    expect(migrations[1].description).toBe('backfill-featured');
    expect(typeof migrations[0].up).toBe('function');
  });

  test('ignores files that are not numbered migrations', () => {
    expect(loadMigrations(FIXTURES).some((migration) => migration.slug === 'helper')).toBe(false);
  });

  test('rejects a numbered file that does not export up()', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-'));
    fs.writeFileSync(path.join(dir, '001-does-nothing.js'), 'module.exports = {};\n');

    expect(() => loadMigrations(dir)).toThrow(/must export an up\(\) function/);
  });

  test('ships an empty-but-valid migrations directory today', () => {
    expect(Array.isArray(shipped())).toBe(true);
  });
});

describe('planMigrations', () => {
  const available = [
    { id: '002', slug: 'second' },
    { id: '001', slug: 'first' },
    { id: '003', slug: 'third' },
  ];

  test('returns only the pending migrations, in order', () => {
    expect(planMigrations({ available, applied: ['001'] }).map((m) => m.id)).toEqual([
      '002',
      '003',
    ]);
  });

  test('is idempotent: an up-to-date database has nothing pending', () => {
    expect(planMigrations({ available, applied: ['001', '002', '003'] })).toEqual([]);
  });

  test('treats a fresh database as fully pending', () => {
    expect(planMigrations({ available, applied: [] }).map((m) => m.id)).toEqual([
      '001',
      '002',
      '003',
    ]);
  });

  test('fails loudly when the database knows a migration the tree does not', () => {
    expect(() => planMigrations({ available, applied: ['001', '007'] })).toThrow(/\b007\b/);
  });
});

describe('applyMigrations', () => {
  const available = [
    { id: '001', slug: 'first', description: 'first change', up: jest.fn() },
    { id: '002', slug: 'second', description: 'second change', up: jest.fn() },
  ];

  test('applies sequentially and reports what ran', async () => {
    const order = [];
    const logs = [];

    const done = await applyMigrations({
      available,
      applied: [],
      apply: async (migration) => order.push(migration.id),
      log: (message) => logs.push(message),
    });

    expect(order).toEqual(['001', '002']);
    expect(done).toEqual(['001', '002']);
    expect(logs[0]).toMatch(/applying 001-first — first change/);
  });

  test('does nothing when the database is up to date', async () => {
    const apply = jest.fn();
    const logs = [];

    const done = await applyMigrations({
      available,
      applied: ['001', '002'],
      apply,
      log: (message) => logs.push(message),
    });

    expect(done).toEqual([]);
    expect(apply).not.toHaveBeenCalled();
    expect(logs.join(' ')).toMatch(/up to date/);
  });

  test('stops at the first failure so the rest is retried later', async () => {
    const attempted = [];

    await expect(
      applyMigrations({
        available,
        applied: [],
        apply: async (migration) => {
          attempted.push(migration.id);
          if (migration.id === '001') throw new Error('boom');
        },
      })
    ).rejects.toThrow('boom');

    expect(attempted).toEqual(['001']);
  });
});
