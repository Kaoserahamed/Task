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
// External providers are unavailable to the unit suite by design. Clearing the
// variables here is a second line of defence after the Jest mocks: an accidental
// SDK call must fail closed instead of discovering credentials from a developer's
// shell or CI environment.
const EXTERNAL_ENV_KEYS = [
  'AWS_ACCESS_KEY_ID',
  'AWS_DEFAULT_REGION',
  'AWS_PROFILE',
  'AWS_REGION',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',
  'BREVO_API_KEY',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'MAIL_FROM_EMAIL',
  'MAIL_FROM_NAME',
  'PUSHER_APP_ID',
  'PUSHER_CLUSTER',
  'PUSHER_KEY',
  'PUSHER_SECRET',
  'REDIS_URL',
  'S3_BUCKET',
  'S3_ENDPOINT',
  'S3_FORCE_PATH_STYLE',
  'SENDINBLUE_API_KEY',
  'SMTP_HOST',
  'SMTP_PASSWORD',
  'SMTP_PORT',
  'SMTP_USER',
  'WEATHER_API_KEY',
];
for (const key of EXTERNAL_ENV_KEYS) {
  process.env[key] = '';
}

// Demo accounts are imported by the seed routes; give them placeholder values
// so importing that module (behind the seed flag) can never throw.
process.env.DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || 'user@example.test';
process.env.DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'test-password';
process.env.DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || 'admin@example.test';
process.env.DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'test-password';
process.env.DEMO_COMPANY_EMAIL = process.env.DEMO_COMPANY_EMAIL || 'company@example.test';
process.env.DEMO_COMPANY_PASSWORD = process.env.DEMO_COMPANY_PASSWORD || 'test-password';
