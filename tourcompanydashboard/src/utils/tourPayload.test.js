import { buildTourCreateFormData, buildTourUpdateFormData, toEditableTour } from './tourPayload';

describe('toEditableTour', () => {
  test('trims ISO timestamps down to date-input values', () => {
    const form = toEditableTour({
      startDate: '2026-05-01T00:00:00.000Z',
      endDate: '2026-05-09T12:30:00.000Z',
    });

    expect(form.startDate).toBe('2026-05-01');
    expect(form.endDate).toBe('2026-05-09');
  });

  test('keeps the fields the API returned', () => {
    const form = toEditableTour({
      name: 'Beach escape',
      price: 4999,
      includes: ['Hotel', 'Breakfast'],
      images: ['/uploads/one.png'],
    });

    expect(form.name).toBe('Beach escape');
    expect(form.price).toBe(4999);
    expect(form.includes).toEqual(['Hotel', 'Breakfast']);
    expect(form.images).toEqual(['/uploads/one.png']);
  });

  test('fills the nested defaults for a partial tour', () => {
    const form = toEditableTour({ name: 'Partial' });

    expect(form.tourType).toEqual({ single: false, group: false });
    expect(form.meals).toEqual({ breakfast: false, lunch: false, dinner: false });
    expect(form.transportation).toEqual({ type: '', details: '' });
    expect(form.weather).toEqual({ city: '', condition: '', temp: '' });
    expect(form.destinations).toEqual([{ name: '', description: '', stayDuration: '' }]);
    expect(form.includes).toEqual(['']);
    expect(form.excludes).toEqual(['']);
    expect(form.images).toEqual([]);
  });

  test('survives a missing tour object', () => {
    const form = toEditableTour(undefined);

    expect(form.name).toBe('');
    expect(form.destinations).toHaveLength(1);
  });
});

describe('buildTourCreateFormData', () => {
  test('serializes scalar and nested fields with the authenticated company', () => {
    const file = new File(['binary'], 'cover.png', { type: 'image/png' });
    const formData = buildTourCreateFormData(
      {
        name: 'Hill Weekend',
        packageCategories: ['Nature & Eco'],
        customCategory: '',
        tourType: { single: false, group: true },
        duration: { days: 2, nights: 1 },
        startDate: '2026-07-01',
        endDate: '2026-07-02',
        meals: { breakfast: true, lunch: false, dinner: false },
        transportation: { type: 'Bus', details: 'Coach' },
        tourGuide: true,
        price: '450',
        maxGroupSize: '12',
        availableSeats: '10',
        destinations: [{ name: 'Sylhet' }],
        images: [file, '/uploads/not-new.png'],
        includes: ['Breakfast'],
        excludes: [],
        specialNote: '',
        cancellationPolicy: '',
        weather: { city: 'Sylhet' },
      },
      { _id: 'company-1', name: 'Contoso Tours' }
    );

    expect(formData.get('name')).toBe('Hill Weekend');
    expect(formData.get('companyId')).toBe('company-1');
    expect(JSON.parse(formData.get('weather'))).toEqual({ city: 'Sylhet' });
    expect(formData.getAll('images')).toEqual([file]);
  });
});

describe('buildTourUpdateFormData', () => {
  test('serialises objects as JSON and keeps scalar fields verbatim', () => {
    const formData = buildTourUpdateFormData({
      name: 'Beach escape',
      duration: { days: 3, nights: 2 },
      price: '4999',
    });

    expect(formData.get('name')).toBe('Beach escape');
    expect(formData.get('price')).toBe('4999');
    expect(JSON.parse(formData.get('duration'))).toEqual({ days: 3, nights: 2 });
  });

  test('sends new files as newImages and stored paths as existingImages', () => {
    const file = new File(['binary'], 'cover.png', { type: 'image/png' });

    const formData = buildTourUpdateFormData({
      name: 'Beach escape',
      images: [file, '/uploads/kept.png'],
    });

    expect(formData.getAll('newImages')).toHaveLength(1);
    expect(formData.getAll('newImages')[0].name).toBe('cover.png');
    expect(JSON.parse(formData.get('existingImages'))).toEqual(['/uploads/kept.png']);
  });
});
