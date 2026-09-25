'use strict';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePagination(query = {}) {
  const page = Number(query.page);
  const limit = Number(query.limit);
  return {
    page: Number.isInteger(page) && page > 0 ? page : DEFAULT_PAGE,
    limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT,
  };
}

module.exports = { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT, parsePagination };
