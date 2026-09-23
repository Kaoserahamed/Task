'use strict';

const request = require('supertest');

const createApp = require('../../app');
const Tour = require('../../models/tours');

/**
 * Integration suite — the real application against a real MongoDB.
 *
 * Everything the unit suite stubs is real here: the Mongoose schema and its
 * validation, the cast of `_id`, the documents that come back. Anything that
 * depends on database behaviour (defaults, indexes, an atomic `$gte` guard)
 * belongs in this file.
 *
 * Run with `npm run test:integration`:
 *   - locally it starts `mongodb-memory-server`;
 *   - in CI a `mongo:7` service container is used through MONGODB_URI_TEST.
 */

function buildTourBody(overrides = {}) {
  return {
    name: 'Test Tour',
    description: 'A beautiful test tour',
    packageCategories: JSON.stringify(['Beach']),
    tourType: JSON.stringify({ single: true, group: false }),
    duration: JSON.stringify({ days: 3, nights: 2 }),
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
    status: 'approved',
    ...overrides,
  };
}

async function seedTour(overrides = {}) {
  const body = buildTourBody(overrides);
  const { _id, ...rest } = body;

  return Tour.create({
    ...rest,
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

describe('tours API against MongoDB', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  test('POST /api/tours persists a tour and returns it', async () => {
    const res = await request(app).post('/api/tours').send(buildTourBody());

    expect(res.status).toBe(201);
    expect(res.body.tour).toMatchObject({ name: 'Test Tour', price: 5000 });

    const stored = await Tour.findById(res.body.tour._id);
    expect(stored).not.toBeNull();
    expect(stored.duration).toMatchObject({ days: 3, nights: 2 });
  });

  test('POST /api/tours answers 400 for a malformed payload without writing', async () => {
    const res = await request(app)
      .post('/api/tours')
      .send(buildTourBody({ destinations: 'not-json' }));

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    expect(await Tour.countDocuments()).toBe(0);
  });

  test('GET /api/tours/approved returns only approved tours', async () => {
    await seedTour();
    await seedTour({ name: 'Pending Tour', status: 'pending' });

    const res = await request(app).get('/api/tours/approved');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.tours[0].name).toBe('Test Tour');
  });

  test('GET /api/tours/:id casts the identifier and 404s when absent', async () => {
    const missing = await request(app).get('/api/tours/000000000000000000000000');
    const invalid = await request(app).get('/api/tours/not-an-id');

    expect(missing.status).toBe(404);
    expect(invalid.status).toBe(400);
    expect(invalid.body.code).toBe('INVALID_IDENTIFIER');
  });

  test('PATCH /api/tours/:id/status approves a tour', async () => {
    const tour = await seedTour({ status: 'pending' });

    const res = await request(app)
      .patch(`/api/tours/${tour._id}/status`)
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    expect((await Tour.findById(tour._id)).status).toBe('approved');
  });

  test('booking seats is atomic: two buyers cannot take the same seat', async () => {
    const tour = await seedTour({ availableSeats: 1, maxGroupSize: 1 });

    const [first, second] = await Promise.all([
      request(app).patch(`/api/tours/${tour._id}/book-seats`).send({ seatsToBook: 1 }),
      request(app).patch(`/api/tours/${tour._id}/book-seats`).send({ seatsToBook: 1 }),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 400]);
    expect((await Tour.findById(tour._id)).availableSeats).toBe(0);
  });

  test('releasing seats never exceeds the group size', async () => {
    const tour = await seedTour({ availableSeats: 3, maxGroupSize: 4 });
    await Tour.updateOne({ _id: tour._id }, { $set: { 'popularity.bookings': 2 } });

    const res = await request(app)
      .patch(`/api/tours/${tour._id}/release-seats`)
      .send({ seatsToRelease: 5 });

    expect(res.status).toBe(200);
    const stored = await Tour.findById(tour._id);
    expect(stored.availableSeats).toBe(4);
    expect(stored.popularity.bookings).toBe(1);
  });

  test('DELETE /api/tours/:id removes the document', async () => {
    const tour = await seedTour();

    const res = await request(app).delete(`/api/tours/${tour._id}`);

    expect(res.status).toBe(200);
    expect(await Tour.findById(tour._id)).toBeNull();
  });

  test('an unknown route still answers with the shared envelope', async () => {
    const res = await request(app).get('/api/tours/nope/nope');

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
