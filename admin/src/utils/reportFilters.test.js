import { filterReports, selectReports, sortReports } from './reportFilters';

const report = (overrides = {}) => ({
  id: 1,
  type: 'user',
  title: 'Poor service during the tour',
  submittedBy: 'Rahul Ahmed',
  submittedAgainst: 'Travel Buddy Ltd',
  date: '2023-05-15',
  status: 'pending',
  priority: 'high',
  ...overrides,
});

const ids = (reports) => reports.map((item) => item.id);

const REPORTS = [
  report({
    id: 1,
    type: 'user',
    title: 'Misleading tour package information',
    status: 'pending',
    priority: 'high',
    date: '2023-05-15',
  }),
  report({
    id: 2,
    type: 'company',
    title: 'Customer refused to follow safety guidelines',
    submittedBy: 'Green Tours',
    status: 'resolved',
    priority: 'medium',
    date: '2023-05-12',
  }),
  report({
    id: 3,
    type: 'user',
    title: 'Customer damaged hotel property',
    status: 'in-progress',
    priority: 'low',
    date: '2023-05-10',
  }),
];

describe('filterReports', () => {
  test('keeps every report for the all tab and for an empty tab', () => {
    expect(filterReports(REPORTS, { tab: 'all' })).toHaveLength(3);
    expect(filterReports(REPORTS, { tab: '' })).toHaveLength(3);
    expect(filterReports(REPORTS)).toHaveLength(3);
  });

  test('filters a tab by report type', () => {
    expect(ids(filterReports(REPORTS, { tab: 'user' }))).toEqual([1, 3]);
    expect(ids(filterReports(REPORTS, { tab: 'company' }))).toEqual([2]);
  });

  test('filters a tab by status, and a value matching neither is empty', () => {
    expect(ids(filterReports(REPORTS, { tab: 'pending' }))).toEqual([1]);
    expect(ids(filterReports(REPORTS, { tab: 'in-progress' }))).toEqual([3]);
    expect(ids(filterReports(REPORTS, { tab: 'resolved' }))).toEqual([2]);
    expect(filterReports(REPORTS, { tab: 'unknown' })).toEqual([]);
  });

  test('searches title, submitter and submittee case-insensitively', () => {
    const reports = [
      report({ id: 1, title: 'Misleading tour package information' }),
      report({ id: 2, submittedBy: 'Green Tours' }),
      report({ id: 3, submittedAgainst: 'Karim Uddin' }),
    ];

    expect(ids(filterReports(reports, { searchTerm: 'PACKAGE' }))).toEqual([1]);
    expect(ids(filterReports(reports, { searchTerm: 'green' }))).toEqual([2]);
    expect(ids(filterReports(reports, { searchTerm: 'karim' }))).toEqual([3]);
    expect(filterReports(reports, { searchTerm: 'nothing here' })).toEqual([]);
  });

  test('combines the tab and the search term', () => {
    expect(ids(filterReports(REPORTS, { tab: 'user', searchTerm: 'misleading' }))).toEqual([1]);
    expect(filterReports(REPORTS, { tab: 'company', searchTerm: 'poor' })).toEqual([]);
  });

  test('treats a blank or whitespace-only search as no search', () => {
    expect(ids(filterReports(REPORTS, { searchTerm: '  ' }))).toEqual([1, 2, 3]);
    expect(ids(filterReports(REPORTS, { searchTerm: null }))).toEqual([1, 2, 3]);
  });

  test('returns an empty array for a missing or malformed list', () => {
    expect(filterReports(null, { tab: 'all' })).toEqual([]);
    expect(filterReports(undefined)).toEqual([]);
    expect(filterReports('nope')).toEqual([]);
  });

  test('tolerates a report with missing searchable fields', () => {
    const reports = [report({ id: 9, title: undefined, submittedBy: null })];

    expect(filterReports(reports, { searchTerm: 'poor' })).toEqual([]);
    expect(filterReports(reports, { searchTerm: 'rahul' })).toEqual([]);
    expect(filterReports(reports)).toHaveLength(1);
  });
});

describe('sortReports', () => {
  test('sorts by date in both directions', () => {
    expect(ids(sortReports(REPORTS, { sortBy: 'date', sortOrder: 'desc' }))).toEqual([1, 2, 3]);
    expect(ids(sortReports(REPORTS, { sortBy: 'date', sortOrder: 'asc' }))).toEqual([3, 2, 1]);
  });

  test('sorts by priority rank, not alphabetically', () => {
    expect(ids(sortReports(REPORTS, { sortBy: 'priority', sortOrder: 'desc' }))).toEqual([1, 2, 3]);
    expect(ids(sortReports(REPORTS, { sortBy: 'priority', sortOrder: 'asc' }))).toEqual([3, 2, 1]);
  });

  test('defaults to newest first', () => {
    expect(ids(sortReports(REPORTS))).toEqual([1, 2, 3]);
  });

  test('keeps the input order for an unknown sort key', () => {
    expect(ids(sortReports(REPORTS, { sortBy: 'title' }))).toEqual([1, 2, 3]);
  });

  test('sinks an unparsable date to the end instead of comparing NaN', () => {
    const reports = [report({ id: 1, date: 'not-a-date' }), report({ id: 2, date: '2023-05-12' })];

    expect(ids(sortReports(reports, { sortBy: 'date', sortOrder: 'desc' }))).toEqual([2, 1]);
    expect(ids(sortReports(reports, { sortBy: 'date', sortOrder: 'asc' }))).toEqual([2, 1]);
  });

  test('does not mutate the array it was given', () => {
    const original = [...REPORTS];
    sortReports(REPORTS, { sortBy: 'date', sortOrder: 'asc' });

    expect(REPORTS).toEqual(original);
  });

  test('returns an empty array for a missing or malformed list', () => {
    expect(sortReports(null)).toEqual([]);
    expect(sortReports('nope')).toEqual([]);
  });
});

describe('selectReports', () => {
  test('filters first, then sorts what is left', () => {
    expect(ids(selectReports(REPORTS, { tab: 'user', sortBy: 'date', sortOrder: 'desc' }))).toEqual(
      [1, 3]
    );
    expect(ids(selectReports(REPORTS, { tab: 'user', sortBy: 'date', sortOrder: 'asc' }))).toEqual([
      3, 1,
    ]);
  });

  test('sorts a filtered subset by priority without the filtered-out reports leaking back in', () => {
    expect(
      ids(selectReports(REPORTS, { tab: 'company', sortBy: 'priority', sortOrder: 'asc' }))
    ).toEqual([2]);
    expect(selectReports(REPORTS, { searchTerm: 'no match', sortBy: 'priority' })).toEqual([]);
  });
});
