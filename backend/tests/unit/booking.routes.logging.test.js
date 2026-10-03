'use strict';

/**
 * Booking route logging.
 *
 * These routes used to log `logger.info('Fetching bookings for tourId:', tourId)`
 * and `logger.error('Error adding booking:', error)`. pino reads a leading string
 * as the message and drops the trailing `Error` into a positional argument, so
 * those lines reached the sink as an unqueryable sentence with no stack — on the
 * two paths a support engineer most needs to trace.
 *
 * The contract these tests pin: the booking routes report a stable `event` name,
 * carry the `tourId` as a field a log query can filter on, and pass the error
 * under `err` where pino serialises its stack. `contracts/logging.test.js` stops
 * new ad-hoc calls appearing; these tests stop the *existing* ones regressing
 * into something that looks structured but is not.
 */

const request = require('supertest');

const Booking = require('../../models/Booking');
const Tour = require('../../models/tours');
const User = require('../../models/User');
const logger = require('../../utils/logger');
const { runInTransaction } = require('../../utils/transaction');
const { signAccessToken } = require('../../utils/token');

/**
 * Only the level methods are stubbed. `createRequestLogger` / `withRequestContext`
 * must stay real: the request-id middleware calls them, and replacing them with
 * stubs fails every request with "createRequestLogger is not a function" before
 * the route under test is ever reached.
 */
jest.mock('../../utils/logger', () => ({
  ...jest.requireActual('../../utils/logger'),
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
}));
jest.mock('../../models/Booking');
jest.mock('../../models/tours');
jest.mock('../../models/User');
jest.mock('../../socket', () => ({ getIO: jest.fn(() => null) }));
jest.mock('../../utils/transaction', () => ({ runInTransaction: jest.fn() }));

const createApp = require('../../app');

const TOUR_ID = '64b7f2c4a1b2c3d4e5f60718';

const validBooking = {
  tourId: TOUR_ID,
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '+1 555 0100',
  address: '12 Analytical Engine Way',
  city: 'London',
  country: 'United Kingdom',
  travelers: 2,
  startDate: '2027-06-01T10:00:00.000Z',
  specialRequests: 'Window seat',
  paymentMethod: 'paypal',
};

/** Every field the logger was handed, flattened for easy assertions. */
const loggedPayloads = () => [
  ...logger.info.mock.calls,
  ...logger.warn.mock.calls,
  ...logger.error.mock.calls,
  ...logger.debug.mock.calls,
];

/**
 * Events from the booking routes specifically. The global error handler logs
 * `http.request.failed` through the same logger on every failure, so an
 * unfiltered list would assert against someone else's event.
 */
const bookingEvents = () =>
  loggedPayloads().filter(
    ([fields]) =>
      fields && typeof fields === 'object' && String(fields.event).startsWith('booking.')
  );

const customerAuth = () => ({ Authorization: `Bearer ${signAccessToken('user-1')}` });

describe('booking route structured logging', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ email: 'ada@example.test' }),
      }),
    });
    Booking.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });
    Booking.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(undefined),
      toObject: () => ({ bookingReference: 'BK-1' }),
    }));
    // Without this the seat-reservation update resolves `undefined`, the route
    // falls through to `Tour.findById(...).session(...)` on an auto-mock, and the
    // request never completes — which surfaces as a supertest timeout rather than
    // an obvious "you forgot a mock".
    Tour.findOneAndUpdate.mockResolvedValue({ price: 100, availableSeats: 5 });
    runInTransaction.mockImplementation((work) => work('session'));
  });

  test('records booking.create with the tour id as a queryable field', async () => {
    await request(app).post('/api/bookings/add').set(customerAuth()).send(validBooking);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'booking.create', tourId: TOUR_ID }),
      expect.any(String)
    );
  });

  test('reports a failed booking as an event carrying the error under err', async () => {
    const failure = new Error('write conflict');
    runInTransaction.mockRejectedValue(failure);

    await request(app).post('/api/bookings/add').set(customerAuth()).send(validBooking);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'booking.create.failed', err: failure }),
      expect.any(String)
    );
  });

  test('no booking route call passes an error as a bare positional argument', async () => {
    // The failure this guards: `logger.error('Error adding booking:', error)`,
    // where pino silently swallows the error and only the string is logged.
    await request(app).post('/api/bookings/add').set(customerAuth()).send(validBooking);

    for (const call of loggedPayloads()) {
      const [fields, ...rest] = call;
      expect(typeof fields).toBe('object');
      for (const arg of rest) {
        expect(arg).not.toBeInstanceOf(Error);
      }
    }
  });

  test('every booking event name is dotted and names its domain', async () => {
    await request(app).post('/api/bookings/add').set(customerAuth()).send(validBooking);

    const names = bookingEvents().map(([fields]) => fields.event);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).toMatch(/^booking\.[a-z0-9_.]+$/);
    }
  });
});
