'use strict';

const express = require('express');
const request = require('supertest');

const {
  validateTour,
  validateTourStatus,
  validateSeatChange,
} = require('../../validators/tour.validator');

const baseBody = () => ({
  name: 'Test Tour',
  description: 'A beautiful test tour',
  packageCategories: JSON.stringify(['Beach']),
  tourType: JSON.stringify({ single: true, group: false }),
  duration: JSON.stringify({ days: '3', nights: '2' }),
  meals: JSON.stringify({ breakfast: true }),
  transportation: JSON.stringify({ type: 'AC Bus' }),
  destinations: JSON.stringify([{ name: 'Beach' }]),
  includes: JSON.stringify(['Hotel']),
  excludes: JSON.stringify(['Flights']),
  weather: JSON.stringify({ city: 'Dhaka', temp: '30' }),
  price: '5000',
});

function appWithTourValidation() {
  const app = express();
  app.use(express.json());
  app.post('/tours', validateTour, (req, res) => res.json({ success: true }));
  return app;
}

describe('validateTour middleware', () => {
  test('lets a well-formed payload through', async () => {
    const res = await request(appWithTourValidation()).post('/tours').send(baseBody());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  test.each([
    ['destinations', 'not-json'],
    ['includes', 'not-json'],
    ['excludes', 'not-json'],
    ['meals', JSON.stringify(['breakfast'])],
    ['transportation', '{broken'],
    ['duration', JSON.stringify({ days: 'x' })],
  ])('rejects a malformed %s with a typed 400', async (field, value) => {
    const res = await request(appWithTourValidation())
      .post('/tours')
      .send({ ...baseBody(), [field]: value });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.error).toMatch(new RegExp(field));
  });

  test('rejects a missing required text field', async () => {
    const body = baseBody();
    delete body.description;

    const res = await request(appWithTourValidation()).post('/tours').send(body);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.error).toMatch(/description/);
  });

  test('rejects a non-numeric price', async () => {
    const res = await request(appWithTourValidation())
      .post('/tours')
      .send({ ...baseBody(), price: 'free' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('requires the array fields to be present', async () => {
    const body = baseBody();
    delete body.excludes;

    const res = await request(appWithTourValidation()).post('/tours').send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/excludes/);
  });
});

describe('validateTourStatus middleware', () => {
  function appWithStatusValidation() {
    const app = express();
    app.use(express.json());
    app.patch('/tours/:id/status', validateTourStatus, (req, res) =>
      res.json({ success: true, status: req.body.status })
    );
    return app;
  }

  test.each(['approved', 'rejected', 'pending'])('accepts the %s status', async (status) => {
    const res = await request(appWithStatusValidation()).patch('/tours/1/status').send({ status });

    expect(res.status).toBe(200);
  });

  test('rejects an unknown status before the controller runs', async () => {
    const res = await request(appWithStatusValidation())
      .patch('/tours/1/status')
      .send({ status: 'deleted' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.error).toMatch(/approved, rejected, pending/);
  });
});

describe('validateSeatChange middleware', () => {
  function appWithSeatValidation(field) {
    const app = express();
    app.use(express.json());
    app.patch('/tours/:id/seats', validateSeatChange(field), (req, res) =>
      res.json({ success: true, seats: req.seats })
    );
    return app;
  }

  test('normalises the seat count onto the request', async () => {
    const res = await request(appWithSeatValidation('seatsToBook'))
      .patch('/tours/1/seats')
      .send({ seatsToBook: '3' });

    expect(res.status).toBe(200);
    expect(res.body.seats).toBe(3);
  });

  test.each([0, -1, 'two', 2.5, undefined])('rejects the seat count %p', async (value) => {
    const res = await request(appWithSeatValidation('seatsToBook'))
      .patch('/tours/1/seats')
      .send({ seatsToBook: value });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
