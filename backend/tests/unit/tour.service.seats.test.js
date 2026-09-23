'use strict';

const { buildService } = require('./support/tourServiceStub');
const { NotFoundError, ValidationError } = require('../../utils/errors');

describe('TourService counters', () => {
  test('incrementViews returns the updated document', async () => {
    const { service, tours } = buildService({
      incrementCounter: jest.fn().mockResolvedValue({ popularity: { views: 12 } }),
    });

    await expect(service.incrementViews('tour-1')).resolves.toMatchObject({
      popularity: { views: 12 },
    });
    expect(tours.incrementCounter).toHaveBeenCalledWith('tour-1', 'popularity.views');
  });

  test('incrementBookings 404s for an unknown tour', async () => {
    const { service } = buildService();

    await expect(service.incrementBookings('missing')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('TourService.bookSeats', () => {
  test('reserves seats atomically and announces the booking', async () => {
    const { service, tours, events } = buildService({
      reserveSeats: jest.fn().mockResolvedValue({ _id: 'tour-1', availableSeats: 7 }),
    });

    const tour = await service.bookSeats('tour-1', 3);

    expect(tours.reserveSeats).toHaveBeenCalledWith('tour-1', 3);
    expect(tour.availableSeats).toBe(7);
    expect(events.emit).toHaveBeenCalledWith('seats_booked', { tourId: 'tour-1', seats: 3 });
  });

  test('explains an oversell with the remaining seat count', async () => {
    const { service } = buildService({
      findById: jest.fn().mockResolvedValue({ _id: 'tour-1', availableSeats: 2 }),
    });

    await expect(service.bookSeats('tour-1', 5)).rejects.toMatchObject({
      status: 400,
      message: 'Only 2 seats available',
      details: { availableSeats: 2 },
    });
  });

  test('404s when the guarded update missed because the tour is gone', async () => {
    const { service } = buildService();

    await expect(service.bookSeats('missing', 1)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('TourService.releaseSeats', () => {
  test('never gives back more seats than the group size', async () => {
    const save = jest.fn().mockImplementation(function save() {
      return Promise.resolve(this);
    });
    const { service } = buildService({
      findById: jest.fn().mockResolvedValue({
        _id: 'tour-1',
        availableSeats: 38,
        maxGroupSize: 40,
        popularity: { bookings: 3 },
        save,
      }),
    });

    const tour = await service.releaseSeats('tour-1', 5);

    expect(tour.availableSeats).toBe(40);
    expect(tour.popularity.bookings).toBe(2);
    expect(save).toHaveBeenCalled();
  });

  test('404s for an unknown tour', async () => {
    const { service } = buildService();

    await expect(service.releaseSeats('missing', 1)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('TourService.seatAvailability', () => {
  test('projects only the seat related fields', async () => {
    const { service } = buildService({
      findById: jest.fn().mockResolvedValue({
        _id: 'tour-1',
        name: 'Beach Trip',
        maxGroupSize: 20,
        availableSeats: 8,
        popularity: { bookings: 12 },
      }),
    });

    await expect(service.seatAvailability('tour-1')).resolves.toEqual({
      tourId: 'tour-1',
      tourName: 'Beach Trip',
      maxGroupSize: 20,
      availableSeats: 8,
      totalBookings: 12,
    });
  });

  test('404s for an unknown tour', async () => {
    const { service } = buildService();

    await expect(service.seatAvailability('missing')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('TourService suggestions', () => {
  test('requires at least one destination', async () => {
    const { service } = buildService();

    await expect(service.suggestByDestinations('')).rejects.toBeInstanceOf(ValidationError);
  });

  test('accepts a single destination and forwards a list', async () => {
    const { service, tours } = buildService();

    await service.suggestByDestinations("Cox's Bazar");

    expect(tours.suggestByDestinations).toHaveBeenCalledWith(["Cox's Bazar"]);
  });

  test('delegates fuzzy name matching', async () => {
    const { service, tours } = buildService();

    await service.suggestByName('beach');

    expect(tours.suggestByName).toHaveBeenCalledWith('beach');
  });
});
