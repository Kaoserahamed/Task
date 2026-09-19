const request = require('supertest');
const express = require('express');
const Tour = require('../models/tours');
const tourController = require('../controllers/tour');

jest.mock('../socket', () => ({
  init: jest.fn(),
  getIO: () => ({ emit: jest.fn() }),
}));

function buildTourPayload(overrides = {}) {
  const base = {
    name: 'Test Tour',
    packageCategories: JSON.stringify(['Beach']),
    tourType: JSON.stringify({ single: true, group: false }),
    duration: JSON.stringify({ days: 3, nights: 2 }),
    startDate: new Date('2026-10-01'),
    endDate: new Date('2026-10-03'),
    meals: JSON.stringify({ breakfast: true, lunch: true, dinner: false }),
    transportation: JSON.stringify({ type: 'AC Bus', details: 'Comfortable bus' }),
    tourGuide: true,
    price: 5000,
    destinations: JSON.stringify([
      { name: 'Beach', description: 'Nice beach', stayDuration: '2 days' },
    ]),
    includes: JSON.stringify(['Hotel']),
    excludes: JSON.stringify(['Flights']),
    weather: JSON.stringify({ city: 'Dhaka', condition: 'Sunny', temp: 30 }),
    images: ['uploads/test.jpg'],
    status: 'approved',
  };
  return { ...base, ...overrides };
}

async function createTourDirect(overrides = {}) {
  const body = buildTourPayload(overrides);
  return Tour.create({
    ...body,
    packageCategories: JSON.parse(body.packageCategories),
    tourType: JSON.parse(body.tourType),
    duration: JSON.parse(body.duration),
    meals: JSON.parse(body.meals),
    transportation: JSON.parse(body.transportation),
    destinations: JSON.parse(body.destinations),
    includes: JSON.parse(body.includes),
    excludes: JSON.parse(body.excludes),
    weather: JSON.parse(body.weather),
  });
}

describe('tour controller', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.get('/api/tours', tourController.getTours);
    app.get('/api/tours/:id', tourController.getTourById);
    app.delete('/api/tours/:id', tourController.deleteTour);
    app.post('/api/tours', (req, res) => {
      req.files = [];
      return tourController.createTour(req, res);
    });
  });

  test('createTour saves a tour and returns 201', async () => {
    const res = await request(app).post('/api/tours').send(buildTourPayload());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.tour).toHaveProperty('name', 'Test Tour');

    const stored = await Tour.findById(res.body.tour._id);
    expect(stored).not.toBeNull();
  });

  test('createTour returns 400 for a malformed JSON payload', async () => {
    const res = await request(app)
      .post('/api/tours')
      .send(buildTourPayload({ destinations: 'not-json' }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('getTours returns created tours', async () => {
    await createTourDirect();
    await createTourDirect({ name: 'Second Tour' });

    const res = await request(app).get('/api/tours');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tours).toHaveLength(2);
  });

  test('getTourById returns 404 for unknown tour', async () => {
    const res = await request(app).get('/api/tours/000000000000000000000000');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('deleteTour removes an existing tour', async () => {
    const tour = await createTourDirect();

    const res = await request(app).delete(`/api/tours/${tour._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(await Tour.findById(tour._id)).toBeNull();
  });

  test('deleteTour returns 404 for unknown tour', async () => {
    const res = await request(app).delete('/api/tours/000000000000000000000000');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
