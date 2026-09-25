import * as Sentry from '@sentry/react';
import { logError } from './utils/logger';

let initialized = false;

/** Initialize optional browser monitoring without collecting default PII. */
export const initializeMonitoring = () => {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  if (initialized || !dsn) return initialized;

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      release: process.env.REACT_APP_RELEASE || undefined,
      sendDefaultPii: false,
      tracesSampleRate: 0.1,
    });
    initialized = true;
  } catch (error) {
    logError('Browser monitoring could not be initialized', error);
  }

  return initialized;
};
