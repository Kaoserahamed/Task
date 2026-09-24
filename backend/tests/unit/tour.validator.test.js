'use strict';

const {
  parseJsonField,
  normalizePackageCategories,
  normalizeDuration,
  buildCreatePayload,
  buildUpdatePayload,
  buildFilterQuery,
} = require('../../validators/tour.validator');
const { ValidationError } = require('../../utils/errors');

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

describe('parseJsonField', () => {
  test('accepts raw objects and arrays without parsing', () => {
    const array = ['a'];

    expect(parseJsonField(array)).toEqual({ ok: true, value: array });
    expect(parseJsonField({ a: 1 })).toEqual({ ok: true, value: { a: 1 } });
  });

  test('reports malformed JSON instead of throwing', () => {
    expect(parseJsonField('{broken')).toEqual({ ok: false, value: null });
  });

  test('treats null/undefined as absent', () => {
    expect(parseJsonField(undefined)).toEqual({ ok: true, value: undefined });
    expect(parseJsonField(null)).toEqual({ ok: true, value: undefined });
  });
});

describe('normalizePackageCategories', () => {
  test('lower-cases a comma separated string', () => {
    expect(normalizePackageCategories('Beach, Mountain')).toEqual(['beach', 'mountain']);
  });

  test('splits JSON arrays', () => {
    expect(normalizePackageCategories('["Beach","City"]')).toEqual(['beach', 'city']);
  });

  test('wraps a single value in an array', () => {
    expect(normalizePackageCategories('Beach')).toEqual(['beach']);
  });

  test('returns undefined for empty input so the field is left untouched', () => {
    expect(normalizePackageCategories('')).toBeUndefined();
    expect(normalizePackageCategories(undefined)).toBeUndefined();
  });
});

describe('normalizeDuration', () => {
  test('coerces string numbers to integers', () => {
    expect(normalizeDuration(JSON.stringify({ days: '3', nights: '2' }))).toEqual({
      days: 3,
      nights: 2,
    });
  });

  test('falls back to 0 for junk values', () => {
    expect(normalizeDuration(JSON.stringify({ days: 'x' }))).toEqual({ days: 0, nights: 0 });
  });

  test('throws a typed error for a non-object payload', () => {
    expect(() => normalizeDuration('"three"')).toThrow(ValidationError);
  });
});

describe('buildCreatePayload', () => {
  test('parses every JSON-encoded field and coerces numbers', () => {
    const payload = buildCreatePayload(baseBody(), [{ path: 'uploads/a.jpg' }]);

    expect(payload).toMatchObject({
      name: 'Test Tour',
      destinations: [{ name: 'Beach' }],
      meals: { breakfast: true },
      duration: { days: 3, nights: 2 },
      price: 5000,
      packageCategories: ['beach'],
      images: ['uploads/a.jpg'],
      weather: { city: 'Dhaka', temp: 30 },
      tourType: { single: true, group: false },
    });
  });

  test('defaults weather to an empty object when absent', () => {
    const body = baseBody();
    delete body.weather;

    expect(buildCreatePayload(body).weather).toEqual({});
  });

  test('accepts fields that are already parsed objects', () => {
    const payload = buildCreatePayload({ ...baseBody(), destinations: [{ name: 'City' }] });

    expect(payload.destinations).toEqual([{ name: 'City' }]);
  });

  test('throws a ValidationError when a required list is not JSON', () => {
    expect(() => buildCreatePayload({ ...baseBody(), includes: 'not-json' })).toThrow(
      ValidationError
    );
  });
});

describe('buildUpdatePayload', () => {
  test('merges kept and newly uploaded images', () => {
    const payload = buildUpdatePayload(
      { ...baseBody(), existingImages: JSON.stringify(['uploads/old.jpg']) },
      [{ path: 'uploads/new.jpg' }]
    );

    expect(payload.images).toEqual(['uploads/old.jpg', 'uploads/new.jpg']);
    expect(payload).not.toHaveProperty('existingImages');
  });

  test('an edited tour always goes back to draft', () => {
    expect(buildUpdatePayload({ ...baseBody(), status: 'approved' }).status).toBe('draft');
  });

  test('drops multipart bookkeeping fields', () => {
    const payload = buildUpdatePayload({ ...baseBody(), newImages: 'x', existingImages: '[]' });

    expect(payload).not.toHaveProperty('newImages');
  });
});

describe('buildFilterQuery', () => {
  test('ignores the "all" sentinel', () => {
    expect(buildFilterQuery({ category: 'all', tourType: 'all' })).toEqual({});
  });

  test('maps categories and tour types onto the document shape', () => {
    expect(buildFilterQuery({ category: 'Beach', tourType: 'group' })).toEqual({
      packageCategories: 'Beach',
      'tourType.group': true,
    });
  });

  test('treats "custom" as the presence of a customCategory', () => {
    expect(buildFilterQuery({ category: 'custom' })).toEqual({
      customCategory: { $exists: true, $ne: '' },
    });
  });
});
