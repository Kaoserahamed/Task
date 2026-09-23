'use strict';

/**
 * Environment shim for every Jest run (unit and integration).
 *
 * Loaded through `setupFiles`, so it executes before any application module —
 * `config/env.js` requires a database URI and a JWT secret and would otherwise
 * terminate the process. Values are only defaults: a real environment (CI,
 * docker compose, a developer's shell) always wins.
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-secret';

// Silent logs keep the Jest output readable; a failing test prints the
// assertion, not a wall of JSON lines.
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';

// Seeding is opt-in and stays disabled unless a test turns it on.
process.env.SEED_ENABLED = process.env.SEED_ENABLED || 'false';
delete process.env.VERCEL;
delete process.env.IS_VERCEL;

// Demo accounts are imported by the seed routes; give them placeholder values
// so importing that module (behind the seed flag) can never throw.
process.env.DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || 'user@example.test';
process.env.DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'test-password';
process.env.DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || 'admin@example.test';
process.env.DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'test-password';
process.env.DEMO_COMPANY_EMAIL = process.env.DEMO_COMPANY_EMAIL || 'company@example.test';
process.env.DEMO_COMPANY_PASSWORD = process.env.DEMO_COMPANY_PASSWORD || 'test-password';
