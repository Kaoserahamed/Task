'use strict';

/**
 * Test double for the tour service collaborators.
 *
 * Not a *.test.js file, so Jest never treats it as a suite: it only provides the
 * in-memory repository / event emitter / logger the service specs drive.
 */
function buildService(overrides = {}) {
  const { TourService } = require('../../../services/tour.service');

  const tours = {
    findAll: jest.fn().mockResolvedValue([]),
    findApproved: jest.fn().mockResolvedValue([]),
    findPending: jest.fn().mockResolvedValue([]),
    findByCompany: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findFiltered: jest.fn().mockResolvedValue([]),
    create: jest.fn(async (data) => ({ ...data, _id: 'tour-1' })),
    updateById: jest.fn().mockResolvedValue(null),
    deleteById: jest.fn().mockResolvedValue(null),
    incrementCounter: jest.fn().mockResolvedValue(null),
    reserveSeats: jest.fn().mockResolvedValue(null),
    suggestByDestinations: jest.fn().mockResolvedValue([]),
    suggestByName: jest.fn().mockResolvedValue([]),
    ...overrides,
  };

  const events = { emit: jest.fn() };
  const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

  return { service: new TourService({ tours, events, log }), tours, events, log };
}

module.exports = { buildService };
