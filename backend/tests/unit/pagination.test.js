'use strict';

const { parsePagination, DEFAULT_LIMIT, MAX_LIMIT } = require('../../utils/pagination');

describe('parsePagination', () => {
  test('uses safe defaults for missing or invalid values', () => {
    expect(parsePagination()).toEqual({ page: 1, limit: DEFAULT_LIMIT });
    expect(parsePagination({ page: '0', limit: '-2' })).toEqual({ page: 1, limit: DEFAULT_LIMIT });
  });

  test('caps the requested page size', () => {
    expect(parsePagination({ page: '2', limit: String(MAX_LIMIT + 50) })).toEqual({ page: 2, limit: MAX_LIMIT });
  });
});
