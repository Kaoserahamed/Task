#!/usr/bin/env node

/**
 * Fail closed when the unit suite could reach an external provider.
 *
 * Jest mocks are the primary boundary; this small static check is the ratchet.
 * It permits a provider import only when the same test file declares a matching
 * jest.mock(...), and rejects raw fetch/http/net/tls calls in unit tests. The
 * checker is dependency-free so it can run before any workspace install.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const unitRoot = path.join(root, 'backend', 'tests', 'unit');
const externalProviders = [
  '@aws-sdk/client-s3',
  '@aws-sdk/s3-request-presigner',
  'axios',
  'cloudinary',
  'ioredis',
  'multer-storage-cloudinary-v2',
  'pusher',
  'sib-api-v3-sdk',
];
const networkPrimitive =
  /(?:\bfetch\s*\(|\b(?:https?|net|tls)\.(?:request|get|connect)\s*\(|new\s+WebSocket\s*\()/;

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(fullPath) : entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

const failures = [];
for (const file of filesIn(unitRoot)) {
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file).replaceAll(path.sep, '/');

  for (const provider of externalProviders) {
    const escaped = provider.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const imported = new RegExp(`require\\(\\s*['"]${escaped}['"]\\s*\\)`).test(source);
    const mocked = new RegExp(`jest\\.mock\\(\\s*['"]${escaped}['"]`).test(source);
    if (imported && !mocked) failures.push(`${relative}: unmocked external provider ${provider}`);
  }

  if (networkPrimitive.test(source)) {
    failures.push(`${relative}: direct network primitive in a unit test`);
  }
}

if (failures.length > 0) {
  console.error('Offline boundary check failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `offline boundary: ok (${filesIn(unitRoot).length} unit files, ${externalProviders.length} provider modules guarded)`
);
