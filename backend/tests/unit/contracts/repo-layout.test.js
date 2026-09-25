'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Layout contract.
 *
 * The repository promises a reproducible setup: exact dependency versions, one
 * command to install, one command to run, and no surprises about which files
 * live where. These assertions keep that promise from eroding.
 */

const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const exists = (...parts) => fs.existsSync(path.join(repoRoot, ...parts));
const read = (...parts) => fs.readFileSync(path.join(repoRoot, ...parts), 'utf8');
const readJson = (...parts) => JSON.parse(read(...parts));

const STACKS = ['backend', 'frontend', 'admin', 'tourcompanydashboard'];

describe('monorepo layout', () => {
  test('every stack pins Node 20.19+ and the shared npm major', () => {
    for (const stack of STACKS) {
      const { engines, packageManager } = readJson(stack, 'package.json');
      expect(engines && engines.node).toMatch(/>=\s*20\.19\.0/);
      expect(engines.npm).toMatch(/>=\s*10\s*<\s*12/);
      expect(packageManager).toBe('npm@11.14.1');
    }
    const root = readJson('package.json');
    expect(root.engines.node).toMatch(/>=\s*20\.19\.0/);
    expect(root.engines.npm).toMatch(/>=\s*10\s*<\s*12/);
    expect(root.packageManager).toBe('npm@11.14.1');
  });

  test('the root exposes conventional test and production-build entry points', () => {
    const root = readJson('package.json');

    expect(root.scripts.build).toBe('npm run build:web');
    expect(root.scripts['verify:build']).toBe('npm run build');
    for (const app of ['frontend', 'admin', 'tourcompanydashboard']) {
      expect(root.scripts['build:web']).toContain(`npm --prefix ${app} run build`);
    }
    expect(root.scripts.verify).toContain('npm run verify:build');
  });

  test('build-only tools are not classified as shipped runtime dependencies', () => {
    for (const stack of STACKS) {
      const manifest = readJson(stack, 'package.json');
      const runtime = manifest.dependencies || {};
      const development = manifest.devDependencies || {};
      if (stack !== 'backend') {
        expect(runtime['react-scripts']).toBeUndefined();
        expect(development['react-scripts']).toBe('5.0.1');
      }
      if (stack === 'backend') {
        expect(runtime.nodemon).toBeUndefined();
        expect(development.nodemon).toBe('^3.1.14');
      }
    }
  });

  test('the dependency-health checker is runnable and owns every package manifest', () => {
    expect(exists('scripts', 'dependency-health.mjs')).toBe(true);
    const root = readJson('package.json');
    expect(root.scripts['dependency:check']).toBe('node scripts/dependency-health.mjs');
    expect(root.scripts['dependency:audit']).toMatch(/--omit=dev/);
    for (const stack of STACKS) {
      expect(readJson(stack, 'package.json').packageManager).toBe('npm@11.14.1');
      expect(exists(stack, 'package-lock.json')).toBe(true);
    }
  });

  test('the editor/line-ending configuration is shared', () => {
    for (const file of ['.editorconfig', '.gitattributes', '.nvmrc']) {
      expect(exists(file)).toBe(true);
    }
  });

  test('upload directories survive a clone without committing user data', () => {
    expect(exists('backend', 'uploads', '.gitkeep')).toBe(true);
    expect(exists('backend', 'public', 'uploads', '.gitkeep')).toBe(true);
    expect(read('.gitignore')).toMatch(/^backend\/uploads\/\*$/m);
  });

  test('every stack can be containerised or documented as such', () => {
    expect(exists('backend', 'Dockerfile')).toBe(true);
    expect(exists('backend', '.dockerignore')).toBe(true);
    expect(exists('docker-compose.yml')).toBe(true);
  });

  test('the compose stack waits for a healthy database', () => {
    const compose = read('docker-compose.yml');

    expect(compose).toMatch(/healthcheck:/);
    expect(compose).toMatch(/condition: service_healthy/);
  });

  test('a test stack exists for integration work', () => {
    expect(exists('docker-compose.test.yml')).toBe(true);
  });

  test('the unit environment blanks external provider configuration', () => {
    const setup = read('backend', 'tests', 'unit', 'setup-env.js');
    for (const name of [
      'CLOUDINARY_API_SECRET',
      'PUSHER_SECRET',
      'SENDINBLUE_API_KEY',
      'WEATHER_API_KEY',
      'REDIS_URL',
      'S3_BUCKET',
      'AWS_SECRET_ACCESS_KEY',
    ]) {
      expect(setup).toContain(`'${name}'`);
    }
    expect(setup).toContain('process.env[key] = ');
  });

  test('the offline boundary checker is dependency-free and covers provider SDKs', () => {
    const checker = read('scripts', 'verify-offline-boundary.mjs');
    expect(exists('scripts', 'verify-offline-boundary.mjs')).toBe(true);
    for (const provider of ['axios', 'cloudinary', 'pusher', 'sib-api-v3-sdk', 'ioredis']) {
      expect(checker).toContain(`'${provider}'`);
    }
    expect(checker).toContain('networkPrimitive');
  });

  test('the commit message policy is configured locally and in CI', () => {
    const manifest = readJson('package.json');
    expect(manifest.scripts['lint:commits']).toContain('commitlint');
    expect(manifest.devDependencies['@commitlint/cli']).toBeDefined();
    expect(manifest.devDependencies['@commitlint/config-conventional']).toBeDefined();
    expect(exists('commitlint.config.mjs')).toBe(true);
  });
});

describe('documentation layout', () => {
  test('the docs directory is indexed', () => {
    expect(exists('docs', 'README.md')).toBe(true);
  });

  test('architecture decisions are recorded', () => {
    const adrDir = path.join(repoRoot, 'docs', 'adr');
    expect(fs.existsSync(adrDir)).toBe(true);

    const adrs = fs.readdirSync(adrDir).filter((file) => file.endsWith('.md'));
    expect(adrs.length).toBeGreaterThanOrEqual(3);
  });

  test('governance files exist at the root', () => {
    for (const file of ['CONTRIBUTING.md', 'SECURITY.md', 'CHANGELOG.md', 'README.md']) {
      expect(exists(file)).toBe(true);
    }
  });

  test('the README points at the docs tree', () => {
    expect(read('README.md')).toMatch(/docs\//);
  });
});
