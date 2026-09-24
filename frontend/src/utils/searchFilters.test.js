import {
  aggregateReviews,
  filterAndSortTours,
  formatDate,
  formatPrice,
  getImageUrl,
  getTourStatus,
  matchesDuration,
  matchesSearchQuery,
  matchesTourType,
  parseSearchFilters,
} from './searchFilters';

const params = (query) => new URLSearchParams(query);

describe('searchFilters', () => {
  test('parses repeated filter parameters from the URL', () => {
    expect(
      parseSearchFilters(
        params(
          'query=hill&priceMax=450&tourType=Family&tourType=Beach&duration=3-5&status=ongoing&sort=rating'
        )
      )
    ).toEqual({
      query: 'hill',
      priceMax: 450,
      tourTypes: ['Family', 'Beach'],
      durations: ['3-5'],
      statuses: ['ongoing'],
      sort: 'rating',
    });
  });

  test('aggregates review totals and counts by tour', () => {
    expect(
      aggregateReviews([
        { tourId: 'tour-1', rating: 5 },
        { tourId: 'tour-1', rating: 4 },
        { tourId: 'tour-2', rating: 3 },
      ])
    ).toEqual({ averages: { 'tour-1': 4.5, 'tour-2': 3 }, counts: { 'tour-1': 2, 'tour-2': 1 } });
  });

  test('classifies tours around date boundaries', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    expect(getTourStatus({ startDate: '2026-06-16', endDate: '2026-06-20' }, now)).toBe('upcoming');
    expect(getTourStatus({ startDate: '2026-06-15', endDate: '2026-06-20' }, now)).toBe('ongoing');
    expect(getTourStatus({ startDate: '2026-06-01', endDate: '2026-06-14' }, now)).toBe(
      'completed'
    );
    expect(getTourStatus({}, now)).toBe('upcoming');
  });

  test('matches search, type, and duration filters', () => {
    const tour = {
      name: 'Hill Expedition',
      description: 'A scenic trip',
      destinations: [{ name: 'Sylhet' }],
      packageCategories: ['Nature & Eco'],
      tourType: { family: true },
      duration: { days: 4 },
    };

    expect(matchesSearchQuery(tour, 'sylhet')).toBe(true);
    expect(matchesTourType(tour, ['Family'])).toBe(true);
    expect(matchesDuration(tour, ['3-5'])).toBe(true);
    expect(matchesDuration(tour, ['1-2'])).toBe(false);
  });

  test('filters and sorts tours deterministically', () => {
    const tours = [
      { _id: 'a', name: 'A', price: 80, duration: { days: 3 }, createdAt: '2026-01-01' },
      { _id: 'b', name: 'B', price: 40, duration: { days: 5 }, createdAt: '2026-02-01' },
    ];
    const result = filterAndSortTours({ tours, sort: 'highest', priceMax: 100 });
    expect(result.map((tour) => tour._id)).toEqual(['a', 'b']);
  });

  test('formats display values and normalizes image paths', () => {
    expect(formatPrice(1200)).toBe('$1,200');
    expect(formatDate('')).toBe('TBA');
    expect(getImageUrl('/uploads/a.jpg', 'https://api.example')).toBe(
      'https://api.example/uploads/a.jpg'
    );
    expect(getImageUrl('https://cdn.example/a.jpg', 'https://api.example')).toBe(
      'https://cdn.example/a.jpg'
    );
  });
});
