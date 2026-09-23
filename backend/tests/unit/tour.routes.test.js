'use strict';

const request = require('supertest');

const createApp = require('../../app');
const repository = require('../../repositories/tour.repository');

/**
 * Route wiring, end to end through the real application.
 *
 * The repository is the only thing replaced: the routers, the validators, the
 * controllers, the error handler and the JSON envelope are all production code
 * paths. This is what catches "the controller returns 200 where the spec says
 * 404" style regressions.
 */

jest.mock('../../repositories/tour.repository');

describe('tour HTTP surface', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findApproved.mockResolvedValue([]);
    repository.findAll.mockResolvedValue([]);
    repository.findPending.mockResolvedValue([]);
    repository.findByCompany.mockResolvedValue([]);
    repository.findFiltered.mockResolvedValue([]);
    repository.suggestByName.mockResolvedValue([]);
    repository.suggestByDestinations.mockResolvedValue([]);
    repository.create.mockResolvedValue({ _id: 'tour-1', name: 'New Tour' });
    repository.incrementCounter.mockResolvedValue({ popularity: { views: 5 } });
  });

  test('GET /api/tours/approved reports an empty result without a 404', async () => {
    const res = await request(app).get('/api/tours/approved');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'No approved tours found', tours: [] });
  });

  test('GET /api/tours/approved returns the count when tours exist', async () => {
    repository.findApproved.mockResolvedValue([{ _id: 'a' }, { _id: 'b' }]);

    const res = await request(app).get('/api/tours/approved');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, count: 2 });
  });

  test('GET /api/tours/:id answers 404 with the standard envelope', async () => {
    repository.findById.mockResolvedValue(null);

    const res = await request(app).get('/api/tours/000000000000000000000000');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: 'Tour not found', code: 'NOT_FOUND' });
  });

  test('GET /api/tours/:id returns the tour', async () => {
    repository.findById.mockResolvedValue({ _id: 'tour-1', name: 'Beach' });

    const res = await request(app).get('/api/tours/tour-1');

    expect(res.status).toBe(200);
    expect(res.body.tour).toMatchObject({ name: 'Beach' });
  });

  test('POST /api/tours creates a tour and answers 201', async () => {
    const body = {
      name: 'Test Tour',
      description: 'A beautiful test tour',
      destinations: JSON.stringify([{ name: 'Beach' }]),
      includes: JSON.stringify(['Hotel']),
      excludes: JSON.stringify(['Flights']),
      meals: JSON.stringify({ breakfast: true }),
      transportation: JSON.stringify({ type: 'AC Bus' }),
      duration: JSON.stringify({ days: 3, nights: 2 }),
      price: '5000',
    };

    const res = await request(app).post('/api/tours').send(body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test Tour', duration: { days: 3, nights: 2 }, price: 5000 })
    );
  });

  test('POST /api/tours rejects a malformed payload before the repository is touched', async () => {
    const res = await request(app).post('/api/tours').send({ name: 'only a name' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('PATCH /api/tours/:id/status refuses an unknown status', async () => {
    const res = await request(app).patch('/api/tours/tour-1/status').send({ status: 'nope' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(repository.updateById).not.toHaveBeenCalled();
  });

  test('PATCH /api/tours/:id/status approves a tour', async () => {
    repository.updateById.mockResolvedValue({ _id: 'tour-1', status: 'approved' });

    const res = await request(app).patch('/api/tours/tour-1/status').send({ status: 'approved' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'Tour status updated to approved' });
  });

  test('GET /api/tours/filter is not swallowed by the :id route', async () => {
    const res = await request(app).get('/api/tours/filter?category=Beach&tourType=group');

    expect(res.status).toBe(200);
    expect(repository.findFiltered).toHaveBeenCalledWith({
      packageCategories: 'Beach',
      'tourType.group': true,
    });
    expect(repository.findById).not.toHaveBeenCalled();
  });

  test('a repository failure becomes a clean 500 without leaking a stack', async () => {
    repository.findAll.mockRejectedValue(new Error('connection reset by peer'));

    const res = await request(app).get('/api/tours');

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ success: false, code: 'INTERNAL_ERROR' });
    expect(JSON.stringify(res.body)).not.toMatch(/at Object|node_modules/);
  });

  test('DELETE /api/tours/:id deletes through the repository', async () => {
    repository.findById.mockResolvedValue({ _id: 'tour-1', images: [] });
    repository.deleteById.mockResolvedValue({ _id: 'tour-1' });

    const res = await request(app).delete('/api/tours/tour-1');

    expect(res.status).toBe(200);
    expect(repository.deleteById).toHaveBeenCalledWith('tour-1');
  });
});
