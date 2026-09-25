import {
  filterCompanyTours,
  matchesTourCategory,
  matchesTourType,
  normalizePackageCategories,
} from './tourFilters';

const tour = (overrides = {}) => ({
  _id: 'tour-1',
  packageCategories: ['Adventure'],
  tourType: { single: true, group: false },
  ...overrides,
});

describe('company tour filters', () => {
  test('normalizes arrays, JSON strings, and comma-separated values', () => {
    expect(normalizePackageCategories(['Adventure', '["Nature", "Family"]'])).toEqual([
      'Adventure',
      'Nature',
      'Family',
    ]);
    expect(normalizePackageCategories('Adventure, Nature')).toEqual(['Adventure', 'Nature']);
  });

  test('matches categories case-insensitively and supports custom categories', () => {
    expect(matchesTourCategory(tour(), 'adventure')).toBe(true);
    expect(matchesTourCategory(tour({ customCategory: 'Wellness' }), 'custom')).toBe(true);
    expect(matchesTourCategory(tour(), 'custom')).toBe(false);
  });

  test('requires an exact true tour-type flag', () => {
    expect(matchesTourType(tour(), 'single')).toBe(true);
    expect(matchesTourType(tour({ tourType: { group: 1 } }), 'group')).toBe(false);
    expect(matchesTourType(tour({ tourType: null }), 'single')).toBe(false);
  });

  test('combines category and type filters without mutating the source', () => {
    const source = [
      tour({ _id: 'adventure-single' }),
      tour({ _id: 'nature-group', packageCategories: ['Nature'], tourType: { group: true } }),
      tour({ _id: 'nature-single', packageCategories: ['Nature'] }),
    ];
    const snapshot = [...source];

    expect(
      filterCompanyTours(source, { category: 'nature', type: 'group' }).map((item) => item._id)
    ).toEqual(['nature-group']);
    expect(source).toEqual(snapshot);
  });

  test('safely handles empty, malformed, and non-array inputs', () => {
    expect(filterCompanyTours(null, { category: 'all' })).toEqual([]);
    expect(
      filterCompanyTours([tour({ packageCategories: ['[broken'] })], { category: 'nature' })
    ).toEqual([]);
    expect(filterCompanyTours([tour()], { category: 'all', type: 'all' })).toHaveLength(1);
  });
});
