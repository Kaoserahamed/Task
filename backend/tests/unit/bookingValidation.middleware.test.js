'use strict';

const express = require('express');
const request = require('supertest');

const validateRequest = require('../../middleware/validateRequest');
const errorHandler = require('../../middleware/errorHandler');
const { bookingCreateSchema } = require('../../validators/booking.validator');

const TOUR_ID = '64b7f2c4a1b2c3d4e5f60718';

function validBooking(overrides = {}) {
  return {
    tourId: TOUR_ID,
    firstName: '  Ada  ',
    lastName: '  Lovelace ',
    phone: ' +1 555 0100 ',
    address: ' 12 Analytical Engine Way ',
    city: ' London ',
    country: ' United Kingdom ',
    travelers: '2',
    startDate: '2027-06-01T10:00:00.000Z',
    specialRequests: '  Window seat ',
    paymentMethod: 'credit-card',
    cardHolder: 'Ada Lovelace',
    cardNumber: '4242424242424242',
    ...overrides,
  };
}

function appWithBookingValidation() {
  const app = express();
  app.use(express.json());
  app.post('/bookings', validateRequest(bookingCreateSchema), (req, res) => res.json(req.body));
  app.use(errorHandler);
  return app;
}

describe('booking request schema', () => {
  test('normalizes a valid credit-card payload and replaces the raw body', async () => {
    const response = await request(appWithBookingValidation())
      .post('/bookings')
      .send(validBooking());

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '+1 555 0100',
      travelers: 2,
      specialRequests: 'Window seat',
      cardHolder: 'Ada Lovelace',
      cardNumber: '4242424242424242',
    });
    expect(response.body.startDate).toBe('2027-06-01T10:00:00.000Z');
  });

  test('accepts a non-card method without card data', async () => {
    const payload = validBooking({ paymentMethod: 'paypal' });
    delete payload.cardHolder;
    delete payload.cardNumber;

    const response = await request(appWithBookingValidation()).post('/bookings').send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ paymentMethod: 'paypal', cardHolder: '' });
    expect(response.body.cardNumber).toBeUndefined();
  });

  test.each([
    ['tourId', 'not-an-object-id', 'tourId'],
    ['firstName', '   ', 'firstName'],
    ['travelers', 0, 'travelers'],
    ['travelers', 2.5, 'travelers'],
    ['travelers', 101, 'travelers'],
    ['startDate', 'not-a-date', 'startDate'],
    ['paymentMethod', 'cash', 'paymentMethod'],
  ])('rejects invalid %s before the route handler', async (field, value, expectedField) => {
    const response = await request(appWithBookingValidation())
      .post('/bookings')
      .send(validBooking({ [field]: value }));

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Request validation failed',
      code: 'VALIDATION_ERROR',
    });
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: expectedField })])
    );
  });

  test('requires both card fields for a credit-card booking', async () => {
    const response = await request(appWithBookingValidation())
      .post('/bookings')
      .send(validBooking({ cardHolder: '', cardNumber: '' }));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'cardHolder' }),
        expect.objectContaining({ field: 'cardNumber' }),
      ])
    );
  });

  test.each(['email', 'userId', 'bookingStatus', 'unexpected'])(
    'rejects client-owned or unknown field %s',
    async (field) => {
      const response = await request(appWithBookingValidation())
        .post('/bookings')
        .send(validBooking({ [field]: 'forged' }));

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field })])
      );
    }
  );

  test('rejects a non-object body', async () => {
    const response = await request(appWithBookingValidation())
      .post('/bookings')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify('not-an-object'));

    expect(response.status).toBe(400);
    expect(['INVALID_JSON', 'VALIDATION_ERROR']).toContain(response.body.code);
  });
});
