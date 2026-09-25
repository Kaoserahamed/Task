import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AppErrorBoundary, { AppErrorFallback } from './AppErrorBoundary';

let consoleError;

beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  delete process.env.REACT_APP_SENTRY_DSN;
});

test('shows an actionable support reference when Sentry provides an event id', () => {
  process.env.REACT_APP_SENTRY_DSN = 'https://public@example.ingest.sentry.io/1';
  const reset = jest.fn();

  render(<AppErrorFallback eventId="event-123" resetError={reset} />);

  expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  expect(screen.getByText('event-123')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(reset).toHaveBeenCalledTimes(1);
});

test('does not show an unusable support reference when monitoring is disabled', () => {
  render(<AppErrorFallback eventId="local-event" resetError={jest.fn()} />);

  expect(screen.queryByText(/Support reference:/)).not.toBeInTheDocument();
});

test('contains a render failure and can recover without reloading', async () => {
  let shouldFail = true;
  const Unstable = () => {
    if (shouldFail) throw new Error('render failed');
    return <p>Recovered view</p>;
  };

  render(
    <AppErrorBoundary>
      <Unstable />
    </AppErrorBoundary>
  );

  expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  shouldFail = false;
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Recovered view')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
