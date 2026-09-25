'use strict';

const { createRequestLogger, withRequestContext } = require('../../utils/logger');

describe('request-scoped logging', () => {
  test('creates a child logger carrying the request id', () => {
    const logger = createRequestLogger('request-test');

    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(logger.bindings().requestId).toBe('request-test');
  });

  test('runs callbacks inside the request context', () => {
    const result = withRequestContext('request-test', () => 'completed');

    expect(result).toBe('completed');
  });
});
