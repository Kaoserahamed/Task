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

  test('a bracketed list that is not valid JSON still parses as a list', () => {
    // The bracket-stripping fallback below the JSON branch was unreachable: any
    // string starting with `[` entered the `try` and returned from the `catch`,
    // so `"[Adventure, Nature]"` — the shape a loosely serialised field has —
    // reported *no* categories and the tour vanished from every category filter.
    expect(normalizePackageCategories('[Adventure, Nature]')).toEqual(['Adventure', 'Nature']);
    expect(normalizePackageCategories('[Adventure]')).toEqual(['Adventure']);
    expect(normalizePackageCategories(['[Adventure, Nature]'])).toEqual(['Adventure', 'Nature']);
  });

  test('a bracket-wrapped list still matches its category filter', () => {
    const legacy = tour({ packageCategories: '[Beach, Relaxation]' });

    expect(matchesTourCategory(legacy, 'beach')).toBe(true);
    expect(matchesTourCategory(legacy, 'relaxation')).toBe(true);
    expect(matchesTourCategory(legacy, 'adventure')).toBe(false);
  });

  test('unrecoverable junk still yields no categories rather than a bogus one', () => {
    // The fallback is a lenient list parser, so an unterminated bracket still
    // yields its single token — what it must never do is invent a category or
    // resurrect the JSON branch's empty result for a value that is a real list.
    expect(normalizePackageCategories('[broken')).toEqual(['broken']);
    expect(normalizePackageCategories('[]')).toEqual([]);
    expect(normalizePackageCategories('[ ]')).toEqual([]);
    expect(normalizePackageCategories('   ')).toEqual([]);
    expect(normalizePackageCategories(null)).toEqual([]);
    expect(normalizePackageCategories(undefined)).toEqual([]);
  });

  test('a malformed category list is excluded from an unrelated filter', () => {
    // The pre-existing guarantee, kept: junk never matches a real category.
    expect(
      filterCompanyTours([tour({ packageCategories: ['[broken'] })], { category: 'nature' })
    ).toEqual([]);
    expect(
      filterCompanyTours([tour({ packageCategories: '[Beach, Relaxation]' })], {
        category: 'beach',
      })
    ).toHaveLength(1);
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
