'use strict';

const request = require('supertest');

const Booking = require('../../models/Booking');
const Tour = require('../../models/tours');
const User = require('../../models/User');
const { runInTransaction } = require('../../utils/transaction');
const { signAccessToken } = require('../../utils/token');

jest.mock('../../models/Booking');
jest.mock('../../models/tours');
jest.mock('../../models/User');
jest.mock('../../socket', () => ({ getIO: jest.fn(() => null) }));
jest.mock('../../utils/transaction', () => ({ runInTransaction: jest.fn() }));

const createApp = require('../../app');

const validBooking = {
  tourId: '64b7f2c4a1b2c3d4e5f60718',
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

function customerAuth() {
  return { Authorization: `Bearer ${signAccessToken('user-1')}` };
}

describe('POST /api/bookings/add request boundary', () => {
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
    const savedBooking = {
      save: jest.fn().mockResolvedValue(undefined),
      toObject: () => ({ bookingReference: 'BK-1' }),
    };
    Booking.mockImplementation(() => savedBooking);
    Tour.findOneAndUpdate.mockResolvedValue({ price: 100, availableSeats: 5 });
    runInTransaction.mockImplementation((work) => work('session'));
  });

  test('authenticates before evaluating the body schema', async () => {
    const response = await request(app).post('/api/bookings/add').send({});

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('NO_TOKEN');
    expect(User.findById).not.toHaveBeenCalled();
  });

  test('derives email and total price on the server before creating a booking', async () => {
    const response = await request(app)
      .post('/api/bookings/add')
      .set(customerAuth())
      .send(validBooking);

    expect(response.status).toBe(201);
    expect(Booking).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ada@example.test',
        totalAmount: 200,
      })
    );
  });

  test.each([
    [{ ...validBooking, tourId: 'bad-id' }, 'tourId'],
    [{ ...validBooking, travelers: 0 }, 'travelers'],
    [{ ...validBooking, startDate: 'not-a-date' }, 'startDate'],
    [{ ...validBooking, totalAmount: 1 }, 'totalAmount'],
    [{ ...validBooking, email: 'victim@example.test' }, 'email'],
    [{ ...validBooking, userId: 'another-user' }, 'userId'],
  ])('rejects malformed field %s before database access', async (payload, field) => {
    const response = await request(app).post('/api/bookings/add').set(customerAuth()).send(payload);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })])
    );
    expect(User.findById).not.toHaveBeenCalled();
    expect(Booking.findOne).not.toHaveBeenCalled();
  });
});
