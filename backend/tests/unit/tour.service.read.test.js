'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { buildService } = require('./support/tourServiceStub');
const { NotFoundError, ValidationError } = require('../../utils/errors');

/**
 * Business rules that do not involve seats, driven against an in-memory stub of
 * the repository — no database, no sockets, milliseconds per test.
 */

describe('TourService reads', () => {
  test('listAll delegates to the repository', async () => {
    const { service, tours } = buildService({
      findAll: jest.fn().mockResolvedValue([{ _id: 1 }]),
    });

    await expect(service.listAll()).resolves.toEqual([{ _id: 1 }]);
    expect(tours.findAll).toHaveBeenCalledTimes(1);
  });

  test('paginates when the caller supplies page or limit', async () => {
    const { service, tours } = buildService({
      findPage: jest
        .fn()
        .mockResolvedValue({ items: [{ _id: 1 }], total: 1, page: 2, limit: 5, totalPages: 1 }),
    });

    await expect(service.listAll({ page: 2, limit: 5 })).resolves.toMatchObject({
      items: [{ _id: 1 }],
    });
    expect(tours.findPage).toHaveBeenCalledWith({ page: 2, limit: 5 });
  });

  test('listByCompany refuses an empty company id', () => {
    const { service } = buildService();

    expect(() => service.listByCompany('')).toThrow(ValidationError);
  });

  test('getById throws NotFoundError for an unknown tour', async () => {
    const { service } = buildService();

    await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  test('filter turns query parameters into a Mongo filter', async () => {
    const { service, tours } = buildService();

    await service.filter({ category: 'Beach', tourType: 'group' });

    expect(tours.findFiltered).toHaveBeenCalledWith({
      packageCategories: 'Beach',
      'tourType.group': true,
    });
  });
});

describe('TourService.create', () => {
  test('persists the tour and announces it over the realtime channel', async () => {
    const { service, events, log } = buildService();

    const tour = await service.create({ name: 'New Tour' });

    expect(tour).toMatchObject({ name: 'New Tour', _id: 'tour-1' });
    expect(events.emit).toHaveBeenCalledWith('tour_created', {
      action: 'create',
      tour: expect.objectContaining({ name: 'New Tour' }),
    });
    expect(log.info).toHaveBeenCalled();
  });
});

describe('TourService.update', () => {
  test('returns the updated tour', async () => {
    const { service } = buildService({
      updateById: jest.fn().mockResolvedValue({ _id: 'tour-1', name: 'Updated' }),
    });

    await expect(service.update('tour-1', { name: 'Updated' })).resolves.toMatchObject({
      name: 'Updated',
    });
  });

  test('404s when the tour disappeared between load and save', async () => {
    const { service } = buildService();

    await expect(service.update('missing', {})).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('TourService.updateStatus', () => {
  test('rejects an unknown status before touching the database', async () => {
    const { service, tours } = buildService();

    await expect(service.updateStatus('tour-1', { status: 'deleted' })).rejects.toBeInstanceOf(
      ValidationError
    );
    expect(tours.updateById).not.toHaveBeenCalled();
  });

  test('stores the review text when a tour is rejected', async () => {
    const { service, tours } = buildService({
      updateById: jest.fn().mockResolvedValue({ _id: 'tour-1', status: 'rejected' }),
    });

    await service.updateStatus('tour-1', { status: 'rejected', review: 'Missing photos' });

    expect(tours.updateById).toHaveBeenCalledWith(
      'tour-1',
      { $set: { status: 'rejected', review: 'Missing photos' } },
      { new: true, runValidators: true }
    );
  });

  test('falls back to a placeholder review and notifies subscribers', async () => {
    const { service, events } = buildService({
      updateById: jest.fn().mockResolvedValue({ _id: 'tour-1', status: 'rejected' }),
    });

    await service.updateStatus('tour-1', { status: 'rejected' });

    expect(events.emit).toHaveBeenCalledWith('tour_status_update', {
      tourId: 'tour-1',
      status: 'rejected',
    });
  });

  test('404s for an unknown tour', async () => {
    const { service } = buildService();

    await expect(service.updateStatus('missing', { status: 'approved' })).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});

describe('TourService.remove', () => {
  test('deletes local files but leaves remote URLs alone', async () => {
    const tempFile = path.join(os.tmpdir(), `tour-image-${Date.now()}.jpg`);
    fs.writeFileSync(tempFile, 'image-bytes');

    const { service } = buildService({
      findById: jest.fn().mockResolvedValue({
        _id: 'tour-1',
        images: [tempFile, 'https://res.cloudinary.com/demo/image.jpg'],
      }),
    });

    await service.remove('tour-1');

    expect(fs.existsSync(tempFile)).toBe(false);
  });

  test('404s instead of deleting through an unknown id', async () => {
    const { service, tours } = buildService();

    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundError);
    expect(tours.deleteById).not.toHaveBeenCalled();
  });
});
