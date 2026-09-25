jest.mock('@sentry/react', () => ({ init: jest.fn() }));

const loadMonitoring = () => {
  let monitoring;
  let sentry;
  jest.isolateModules(() => {
    monitoring = require('./monitoring');
    sentry = require('@sentry/react');
  });
  return { monitoring, sentry };
};

describe('browser monitoring', () => {
  beforeEach(() => {
    delete process.env.REACT_APP_SENTRY_DSN;
    delete process.env.REACT_APP_RELEASE;
  });

  test('stays disabled when no DSN is configured', () => {
    const { monitoring, sentry } = loadMonitoring();

    expect(monitoring.initializeMonitoring()).toBe(false);
    expect(sentry.init).not.toHaveBeenCalled();
  });

  test('initializes once with release metadata and PII disabled', () => {
    process.env.REACT_APP_SENTRY_DSN = 'https://public@example.ingest.sentry.io/1';
    process.env.REACT_APP_RELEASE = 'task-company@1.0.0';
    const { monitoring, sentry } = loadMonitoring();

    expect(monitoring.initializeMonitoring()).toBe(true);
    expect(monitoring.initializeMonitoring()).toBe(true);
    expect(sentry.init).toHaveBeenCalledTimes(1);
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: process.env.REACT_APP_SENTRY_DSN,
        release: 'task-company@1.0.0',
        sendDefaultPii: false,
      })
    );
  });

  test('keeps the app usable when the provider rejects configuration', () => {
    process.env.REACT_APP_SENTRY_DSN = 'invalid-dsn';
    const { monitoring, sentry } = loadMonitoring();
    sentry.init.mockImplementation(() => {
      throw new Error('invalid DSN');
    });

    expect(monitoring.initializeMonitoring()).toBe(false);
  });
});
