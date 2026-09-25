'use strict';

const seed = require('../../scripts/seedTourPackages');

const company = { _id: 'company-1', name: 'Demo Travel Company' };

describe('tour seed fixtures', () => {
  test('ships five named tours with valid package data', () => {
    expect(seed.sampleTours).toHaveLength(5);
    expect(seed.sampleTours.map((tour) => tour.name)).toEqual([
      "Amazing Cox's Bazar Beach Tour",
      'Sundarbans Mangrove Forest Adventure',
      'Sajek Valley Hill Trek',
      'Historical Dhaka City Tour',
      'Sylhet Tea Garden & Waterfall Tour',
    ]);
    for (const tour of seed.sampleTours) {
      expect(tour.packageCategories.length).toBeGreaterThan(0);
      expect(tour.duration.days).toBeGreaterThan(0);
      expect(tour.destinations.length).toBeGreaterThan(0);
      expect(tour.status).toBe('approved');
    }
  });

  test('keeps date fixtures as Date values when present', () => {
    const dated = seed.sampleTours.filter((tour) => tour.startDate || tour.endDate);
    expect(dated.length).toBeGreaterThan(0);
    expect(
      dated.every((tour) =>
        [tour.startDate, tour.endDate].filter(Boolean).every((date) => date instanceof Date)
      )
    ).toBe(true);
  });

  test('adds company ownership and default images without mutating fixtures', () => {
    const original = structuredClone(seed.sampleTours);
    const tours = seed.addCompanyToTours(seed.sampleTours, company);

    expect(tours).toHaveLength(5);
    expect(
      tours.every((tour) => tour.companyId === company._id && tour.companyName === company.name)
    ).toBe(true);
    expect(tours.every((tour) => tour.images.length === seed.DEFAULT_IMAGES.length)).toBe(true);
    expect(seed.sampleTours).toEqual(original);
  });
});

describe('seedTourPackages', () => {
  test('rejects missing required configuration before connecting', async () => {
    const database = { connect: jest.fn(), disconnect: jest.fn() };

    await expect(
      seed.seedTourPackages({ uri: '', email: 'demo@example.test', password: 'secret', database })
    ).rejects.toThrow(/MONGODB_URI/);
    await expect(
      seed.seedTourPackages({ uri: 'mongodb://example', email: '', password: 'secret', database })
    ).rejects.toThrow(/DEMO_COMPANY_EMAIL/);
    await expect(
      seed.seedTourPackages({
        uri: 'mongodb://example',
        email: 'demo@example.test',
        password: '',
        database,
      })
    ).rejects.toThrow(/DEMO_COMPANY_PASSWORD/);
    expect(database.connect).not.toHaveBeenCalled();
  });

  test('clears old tours, inserts owned fixtures, and disconnects', async () => {
    const database = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };
    const companyModel = { findOne: jest.fn().mockResolvedValue(company) };
    const tourModel = {
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 2 }),
      insertMany: jest.fn().mockImplementation(async (tours) => tours),
    };

    const result = await seed.seedTourPackages({
      uri: 'mongodb://example',
      email: 'demo@example.test',
      password: 'secret',
      database,
      companyModel,
      tourModel,
      log: jest.fn(),
    });

    expect(database.connect).toHaveBeenCalledWith(
      'mongodb://example',
      expect.objectContaining({ family: 4 })
    );
    expect(companyModel.findOne).toHaveBeenCalledWith({ email: 'demo@example.test' });
    expect(tourModel.deleteMany).toHaveBeenCalledWith({ companyId: company._id });
    expect(tourModel.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ companyId: company._id })])
    );
    expect(result.createdTours).toHaveLength(5);
    expect(database.disconnect).toHaveBeenCalledTimes(1);
  });

  test('disconnects when insertion fails', async () => {
    const database = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };
    const companyModel = { findOne: jest.fn().mockResolvedValue(company) };
    const tourModel = {
      deleteMany: jest.fn().mockResolvedValue(undefined),
      insertMany: jest.fn().mockRejectedValue(new Error('insert failed')),
    };

    await expect(
      seed.seedTourPackages({
        uri: 'mongodb://example',
        email: 'demo@example.test',
        password: 'secret',
        database,
        companyModel,
        tourModel,
        log: jest.fn(),
      })
    ).rejects.toThrow('insert failed');
    expect(database.disconnect).toHaveBeenCalledTimes(1);
  });
});
