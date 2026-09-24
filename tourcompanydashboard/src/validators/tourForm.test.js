import validateTourForm from './tourForm';

const validTour = {
  name: 'Hill Weekend',
  tourType: { group: true },
  packageCategories: ['Nature & Eco'],
  duration: { days: 2, nights: 1 },
  price: 450,
  transportation: { type: 'Bus' },
  availableSeats: 12,
  startDate: '2026-07-01',
  endDate: '2026-07-02',
  destinations: [{ name: 'Sylhet' }],
};

describe('validateTourForm', () => {
  test('accepts a complete group tour', () => {
    expect(validateTourForm(validTour)).toEqual({ valid: true, errors: {}, message: '' });
  });

  test('reports missing required fields with field-level messages', () => {
    const result = validateTourForm({ tourType: { group: false }, destinations: [] });

    expect(result.valid).toBe(false);
    expect(result.errors).toMatchObject({
      name: expect.any(String),
      tourType: expect.any(String),
      packageCategories: expect.any(String),
      days: expect.any(String),
      price: expect.any(String),
      transportation: expect.any(String),
      availableSeats: expect.any(String),
      destinations: expect.any(String),
    });
  });

  test('rejects reversed group-tour dates', () => {
    const result = validateTourForm({
      ...validTour,
      startDate: '2026-07-03',
      endDate: '2026-07-02',
    });

    expect(result.valid).toBe(false);
    expect(result.errors.dates).toMatch(/on or after/i);
  });
});
