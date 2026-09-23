'use strict';

const request = require('supertest');

const createApp = require('../../app');
const repository = require('../../repositories/tour.repository');

/**
 * The seat endpoints deserve their own spec: booking is the one place where a
 * race can lose money, so the guard (repository.reserveSeats) must be the thing
 * that decides, never a read-then-write in the controller.
 */

jest.mock('../../repositories/tour.repository');

describe('seat endpoints', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects a seat count below one', async () => {
    const res = await request(app).patch('/api/tours/tour-1/book-seats').send({ seatsToBook: 0 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(repository.reserveSeats).not.toHaveBeenCalled();
  });

  test('reserves seats through the guarded update', async () => {
    repository.reserveSeats.mockResolvedValue({ _id: 'tour-1', availableSeats: 4 });

    const res = await request(app).patch('/api/tours/tour-1/book-seats').send({ seatsToBook: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ seatsBooked: 2, remainingSeats: 4 });
    expect(repository.reserveSeats).toHaveBeenCalledWith('tour-1', 2);
  });

  test('reports an oversell as a 400 with the remaining seats', async () => {
    repository.reserveSeats.mockResolvedValue(null);
    repository.findById.mockResolvedValue({ _id: 'tour-1', availableSeats: 1 });

    const res = await request(app).patch('/api/tours/tour-1/book-seats').send({ seatsToBook: 2 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ availableSeats: 1 });
    expect(res.body.error).toMatch(/Only 1 seat available/);
  });

  test('an unknown tour while booking is a 404, not a 400', async () => {
    repository.reserveSeats.mockResolvedValue(null);
    repository.findById.mockResolvedValue(null);

    const res = await request(app).patch('/api/tours/missing/book-seats').send({ seatsToBook: 1 });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  test('releasing seats answers with the new availability', async () => {
    repository.findById.mockResolvedValue({
      _id: 'tour-1',
      availableSeats: 3,
      maxGroupSize: 10,
      popularity: { bookings: 2 },
      save: jest.fn().mockImplementation(function save() {
        return Promise.resolve(this);
      }),
    });

    const res = await request(app)
      .patch('/api/tours/tour-1/release-seats')
      .send({ seatsToRelease: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ seatsReleased: 2, availableSeats: 5 });
  });

  test('seat availability is a read-only projection', async () => {
    repository.findById.mockResolvedValue({
      _id: 'tour-1',
      name: 'Beach Trip',
      maxGroupSize: 20,
      availableSeats: 8,
      popularity: { bookings: 12 },
    });

    const res = await request(app).get('/api/tours/tour-1/seat-availability');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      tourId: 'tour-1',
      tourName: 'Beach Trip',
      maxGroupSize: 20,
      availableSeats: 8,
      totalBookings: 12,
    });
  });
});
