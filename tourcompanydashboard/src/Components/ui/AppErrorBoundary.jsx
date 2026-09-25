import React from 'react';
import { ErrorBoundary } from '@sentry/react';
import './AppErrorBoundary.css';

export const AppErrorFallback = ({ eventId, resetError }) => (
  <main className="app-error-boundary" role="alert" aria-live="assertive">
    <section className="app-error-boundary__card">
      <p className="app-error-boundary__eyebrow">TASK could not load this view</p>
      <h1>Something went wrong</h1>
      <p>
        Your account and data are safe. Try the view again, or return to the home page if the
        problem continues.
      </p>
      {eventId && process.env.REACT_APP_SENTRY_DSN && (
        <p className="app-error-boundary__reference">
          Support reference: <code>{eventId}</code>
        </p>
      )}
      <div className="app-error-boundary__actions">
        <button type="button" onClick={resetError}>
          Try again
        </button>
        <a href="/">Return home</a>
      </div>
    </section>
  </main>
);

const AppErrorBoundary = ({ children }) => (
  <ErrorBoundary fallback={AppErrorFallback}>{children}</ErrorBoundary>
);

export default AppErrorBoundary;
