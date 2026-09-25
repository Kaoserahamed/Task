import filterMonitoringTours from './tourMonitoringFilters';

const now = new Date('2026-07-15T12:00:00.000Z');

const tour = (overrides = {}) => ({
  _id: 'tour-1',
  name: 'Kandy Heritage',
  status: 'approved',
  destinations: [{ name: 'Kandy' }],
  startDate: '2026-08-01',
  endDate: '2026-08-05',
  ...overrides,
});

const ids = (tours) => tours.map((item) => item._id);

describe('admin tour monitoring filters', () => {
  test('returns all tours for the all tab', () => {
    expect(
      filterMonitoringTours([tour(), tour({ _id: 'tour-2', status: 'pending' })], { now })
    ).toHaveLength(2);
  });

  test('filters exact status tabs and ignores unknown tabs', () => {
    const tours = [
      tour({ _id: 'approved' }),
      tour({ _id: 'pending', status: 'pending' }),
      tour({ _id: 'rejected', status: 'rejected' }),
    ];

    expect(ids(filterMonitoringTours(tours, { tab: 'approved', now }))).toEqual(['approved']);
    expect(ids(filterMonitoringTours(tours, { tab: 'pending', now }))).toEqual(['pending']);
    expect(ids(filterMonitoringTours(tours, { tab: 'rejected', now }))).toEqual(['rejected']);
    expect(filterMonitoringTours(tours, { tab: 'unknown', now })).toEqual([]);
  });

  test('filters upcoming and finished approved tours by valid dates', () => {
    const tours = [
      tour({ _id: 'upcoming' }),
      tour({ _id: 'finished', startDate: '2026-06-01', endDate: '2026-07-01' }),
      tour({ _id: 'invalid', startDate: 'not-a-date' }),
      tour({ _id: 'pending', status: 'pending', endDate: '2026-07-01' }),
    ];

    expect(ids(filterMonitoringTours(tours, { tab: 'upcoming', now }))).toEqual(['upcoming']);
    expect(ids(filterMonitoringTours(tours, { tab: 'finished', now }))).toEqual(['finished']);
  });

  test('searches names and destinations across status and date tabs', () => {
    const tours = [
      tour({ _id: 'name-match' }),
      tour({ _id: 'destination-match', name: 'Hill Country', destinations: [{ name: 'Nuwara' }] }),
      tour({ _id: 'other', name: 'Beach Break', destinations: [{ name: 'Galle' }] }),
    ];

    expect(ids(filterMonitoringTours(tours, { searchTerm: 'kandy', now }))).toEqual(['name-match']);
    expect(
      ids(filterMonitoringTours(tours, { tab: 'upcoming', searchTerm: 'nuwara', now }))
    ).toEqual(['destination-match']);
  });

  test('handles empty arrays, blank search, and malformed destinations', () => {
    expect(filterMonitoringTours(null, { now })).toEqual([]);
    expect(
      filterMonitoringTours([tour({ destinations: null })], { searchTerm: '  ', now })
    ).toHaveLength(1);
    expect(
      filterMonitoringTours([tour({ destinations: [{ name: null }] })], {
        searchTerm: 'missing',
        now,
      })
    ).toEqual([]);
  });
});
