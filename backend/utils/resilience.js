'use strict';

const DEFAULT_DELAYS = [100, 250, 500];

class CircuitBreaker {
  constructor({ threshold = 5, resetMs = 30000 } = {}) {
    this.threshold = threshold;
    this.resetMs = resetMs;
    this.failures = 0;
    this.openedAt = 0;
  }

  canRequest() {
    if (!this.openedAt) return true;
    if (Date.now() - this.openedAt >= this.resetMs) {
      this.openedAt = 0;
      this.failures = 0;
      return true;
    }
    return false;
  }

  success() {
    this.failures = 0;
  }
  failure() {
    this.failures += 1;
    if (this.failures >= this.threshold) this.openedAt = Date.now();
  }
}

async function withRetry(operation, { retries = 2, delays = DEFAULT_DELAYS, breaker } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (breaker && !breaker.canRequest()) {
      const error = new Error('Upstream circuit is open');
      error.code = 'CIRCUIT_OPEN';
      throw error;
    }
    try {
      const result = await operation();
      if (breaker) breaker.success();
      return result;
    } catch (error) {
      lastError = error;
      if (breaker) breaker.failure();
      if (attempt === retries || !isRetryable(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, delays[attempt] || delays.at(-1)));
    }
  }
  throw lastError;
}

function isRetryable(error) {
  return !error || error.retryable !== false;
}

module.exports = { CircuitBreaker, withRetry, isRetryable };
