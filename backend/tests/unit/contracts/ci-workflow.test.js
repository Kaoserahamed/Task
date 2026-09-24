'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Repository contracts.
 *
 * These are the guards that keep the project from silently drifting away from
 * the properties the criteria ask for: a fresh clone that installs and tests
 * itself, one quality gate definition that CI and a laptop share, and no
 * runtime data committed as source.
 *
 * They are deliberately text assertions rather than a full YAML/JSON-schema
 * validation: a missing gate matters far more than the exact spacing used to
 * declare it.
 */

const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const read = (...parts) => fs.readFileSync(path.join(repoRoot, ...parts), 'utf8');

describe('CI workflow contract', () => {
  const workflow = read('.github', 'workflows', 'ci.yml');

  test('runs on pushes and pull requests to the protected branches', () => {
    expect(workflow).toMatch(/^on:/m);
    expect(workflow).toMatch(/pull_request:/);
    expect(workflow).toMatch(/branches: \[main, develop\]/);
  });

  test('cancels superseded runs instead of queueing them', () => {
    expect(workflow).toMatch(/concurrency:/);
    expect(workflow).toMatch(/cancel-in-progress: true/);
  });

  test('runs with the least privilege it needs', () => {
    expect(workflow).toMatch(/permissions:/);
    expect(workflow).toMatch(/contents: read/);
  });

  test('gates formatting, linting, types and tests for every stack', () => {
    for (const gate of [
      'npm run format:check',
      'npm run lint',
      'npm run typecheck',
      'npm run test:coverage',
    ]) {
      expect(workflow).toContain(gate);
    }
  });

  test('installs reproducibly with npm ci', () => {
    expect(workflow).toMatch(/npm ci/);
    expect(workflow).not.toMatch(/npm install/);
  });

  test('pins the Node version the manifests require', () => {
    // One place to bump: the workflow-level env var, used by every job.
    expect(workflow).toMatch(/NODE_VERSION: '20'/);
    expect(workflow).toMatch(/node-version: \$\{\{ env\.NODE_VERSION \}\}/);
  });

  test('caches dependencies per stack', () => {
    expect(workflow).toMatch(/cache-dependency-path:/);
  });

  test('publishes the backend coverage report as an artifact', () => {
    expect(workflow).toMatch(/uses: actions\/upload-artifact@v4/);
    expect(workflow).toMatch(/backend\/coverage/);
  });

  test('audits dependencies at a level that fails on high severity', () => {
    expect(workflow).toMatch(/npm audit --audit-level=high/);
  });

  test('proves a fresh clone installs and verifies itself', () => {
    expect(workflow).toMatch(/fresh-clone:/);
    expect(workflow).toMatch(/npm run verify:repo/);
    expect(workflow).toMatch(/npm run verify/);
  });

  test('gates Terraform formatting, validation, planning, and policy scanning', () => {
    const securityWorkflow = read('.github', 'workflows', 'security.yml');
    expect(securityWorkflow).toMatch(/terraform fmt -check -recursive/);
    expect(securityWorkflow).toMatch(/terraform validate/);
    expect(securityWorkflow).toMatch(/terraform plan/);
    expect(securityWorkflow).toMatch(/scan-ref: infrastructure\/terraform/);
    expect(securityWorkflow).toMatch(/scan-type: config/);
    expect(securityWorkflow).toMatch(/scanners: misconfig/);
  });

  test('runs the integration suite against a real database service', () => {
    expect(workflow).toMatch(/integration:/);
    expect(workflow).toMatch(/mongo:/);
    expect(workflow).toMatch(/MONGODB_URI_TEST/);
  });
});

describe('secrets contract', () => {
  test('the monorepo has a discoverable root environment template', () => {
    const rootTemplate = read('.env.example');
    expect(rootTemplate).toMatch(/MONGODB_URI=/);
    expect(rootTemplate).toMatch(/JWT_SECRET=your_/);
    expect(rootTemplate).toMatch(/REACT_APP_API_URL=/);
    expect(rootTemplate).toMatch(/Never put real credentials/i);
    expect(rootTemplate).not.toMatch(/AKIA[0-9A-Z]{16}/);
  });

  test('no .env file is tracked in git', () => {
    const gitignore = read('.gitignore');

    expect(gitignore).toMatch(/^\*\.env$/m);
    expect(gitignore).toMatch(/^\*\.env\.\*$/m);
    expect(gitignore).toMatch(/^!\.env\.example$/m);
  });

  test('the committed env template only carries placeholders', () => {
    const template = read('backend', '.env.example');

    expect(template).toMatch(/JWT_SECRET=your_jwt_secret_key_here_change_in_production/);
    expect(template).not.toMatch(/mongodb\+srv:\/\/[^:]+:[^@]+@cluster0\./);
  });
});
