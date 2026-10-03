'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Structured logging contract.
 *
 * The API logs through pino (`utils/logger.js`), but pino is only structured if
 * the caller actually passes fields. The call this guards against is:
 *
 *     logger.error('Error adding booking:', error);
 *
 * pino treats a bare string as the message and silently drops the `Error` into a
 * positional argument, so the line lands in the log sink as the useless string
 * `"Error adding booking:"` — no event to filter on, no `tourId` to correlate, no
 * stack to triage. String-interpolated variants are worse: they bake values into
 * the message, which is neither queryable nor safe when the value is a payload.
 *
 * The rule: every `logger.*` call in application code takes an object literal
 * carrying a stable `event` key, plus a human-readable message. The event name
 * is the durable API here — it is what dashboards and alerts match on, so it is
 * a dotted `<domain>.<action>` string and not a free-form sentence.
 *
 * `scripts/` is exempt by construction (the walker skips it): a CLI's job is to
 * print for a human at a terminal, so its box-drawing output and plain messages
 * are correct there and only there. `tests/` is skipped for the same reason —
 * assertions deliberately call the logger with fixtures.
 *
 * A guard nobody tests is a guard that quietly stops guarding, so the last test
 * in this file feeds the detector a known-bad and a known-good sample and fails
 * if the detector cannot tell them apart.
 */

const backendRoot = path.resolve(__dirname, '..', '..', '..');

/**
 * Walk application source. Mirrors the layering contract's walker so both
 * guards agree on what "application code" means.
 */
function listBackendFiles(dir = backendRoot) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'coverage', 'build', 'tests', 'scripts'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listBackendFiles(full));
    } else if (entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

const relative = (file) => path.relative(backendRoot, file).split(path.sep).join('/');
const read = (file) => fs.readFileSync(file, 'utf8');

/** Strip block and line comments so prose about logging is never a violation. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
}

const LOG_METHODS = 'trace|debug|info|warn|error|fatal';

/**
 * Locate the first argument of every `logger.*(` call.
 *
 * A regex alone is not enough: the shape Prettier produces is
 * `logger.error(\n  { err: error, event: 'x' },\n  'message'\n)`, whose first
 * argument spans lines and contains commas of its own. So each call is scanned
 * character by character, tracking bracket depth and skipping string/template
 * literals, and the argument ends at the first comma or closing paren that sits
 * at the call's own depth. Anything less either truncates the argument at its
 * first internal comma or runs past the end of the call.
 */
function firstArguments(source) {
  const callStart = new RegExp(`\\blogger\\.(?:${LOG_METHODS})\\s*\\(`, 'g');
  const args = [];

  for (const match of source.matchAll(callStart)) {
    let i = match.index + match[0].length;
    let depth = 0;
    let quote = null;

    for (; i < source.length; i += 1) {
      const ch = source[i];

      if (quote) {
        if (ch === '\\') i += 1;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') {
        quote = ch;
        continue;
      }
      if (ch === '{' || ch === '[' || ch === '(') {
        depth += 1;
        continue;
      }
      if (ch === '}' || ch === ']' || ch === ')') {
        if (depth === 0) {
          // Closing paren of the call itself: the argument ends here.
          args.push(source.slice(match.index + match[0].length, i));
          break;
        }
        depth -= 1;
        continue;
      }
      if (ch === ',' && depth === 0) {
        args.push(source.slice(match.index + match[0].length, i));
        break;
      }
    }
  }
  return args;
}

/** A call is compliant when its first argument is an object literal with an `event`. */
function violationsIn(source) {
  return firstArguments(stripComments(source))
    .map((arg) => arg.trim())
    .filter((arg) => !(arg.startsWith('{') && /\bevent\s*:/.test(arg)))
    .map((arg) => arg.slice(0, 60));
}

describe('structured logging contract', () => {
  const sourceFiles = listBackendFiles().map((file) => ({ file, name: relative(file) }));

  test('application code has source files to check', () => {
    expect(sourceFiles.length).toBeGreaterThan(20);
  });

  test('every logger call carries a structured event object', () => {
    const offenders = sourceFiles
      .filter((entry) => violationsIn(read(entry.file)).length > 0)
      .map((entry) => ({
        file: entry.name,
        calls: violationsIn(read(entry.file)),
      }))
      .sort((a, b) => a.file.localeCompare(b.file));

    expect(offenders).toEqual([]);
  });

  test('the detector still recognises a bare string call', () => {
    // Guards the guard: if this regex ever stops matching ad-hoc calls, the
    // test above would start reporting an empty offender list forever.
    expect(violationsIn("logger.error('Error adding booking:', error);")).toHaveLength(1);
    expect(violationsIn('logger.info(`Cannot emit event "${event}"`);')).toHaveLength(1);
  });

  test('the detector accepts the wrapped structured form it will actually see', () => {
    const structured = [
      "logger.error({ err: error, event: 'booking.create.failed' }, 'failed');",
      "logger.error(\n  { err: error, event: 'booking.create.failed' },\n  'failed'\n);",
      "logger.info({ event: 'socket.emit.unavailable', emittedEvent: event }, 'cannot emit');",
      "requestLogger.debug({ requestId: req.id, event: 'http.request.rejected' }, 'rejected');",
    ];
    for (const sample of structured) {
      expect(violationsIn(sample)).toEqual([]);
    }
  });

  test('logging inside a comment is documentation, not a violation', () => {
    const documented = [
      '/**\n * The middleware used to `logger.info(token)` on every request.\n */',
      "// logger.info('Fetching bookings for tourId:', tourId);",
    ];
    for (const sample of documented) {
      expect(violationsIn(sample)).toEqual([]);
    }
  });

  test('the scripts directory is exempt from the structured contract', () => {
    // A CLI prints for a human, so its plain output is deliberate. This test
    // exists so that widening the walker into `scripts/` fails loudly here
    // rather than as a wall of confusing offenses elsewhere.
    expect(listBackendFiles().some((file) => relative(file).startsWith('scripts/'))).toBe(false);
    expect(fs.existsSync(path.join(backendRoot, 'scripts'))).toBe(true);
  });
});
