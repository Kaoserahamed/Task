// Reports list filtering and sorting, extracted from the Reports component so
// the rules are unit-testable in isolation and the component stays a view over
// this selector. Mirrors the shape of `tourMonitoringFilters.js`:
// null-safe, total (returns an array for any input), and side-effect free.

const PRIORITY_ORDER = { low: 1, medium: 2, high: 3 };

const asDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// A report belongs to a tab when it was filed as that kind of report ("user",
// "company") or currently sits in that status ("pending", "in-progress",
// "resolved"). "all" — and any empty tab — keeps everything.
const matchesTab = (report, tab) => {
  if (!tab || tab === 'all') return true;
  return report?.type === tab || report?.status === tab;
};

const matchesSearch = (report, searchTerm) => {
  if (!searchTerm) return true;
  const query = String(searchTerm).trim().toLowerCase();
  if (!query) return true;
  return ['title', 'submittedBy', 'submittedAgainst'].some((field) =>
    String(report?.[field] || '')
      .toLowerCase()
      .includes(query)
  );
};

/** Reports matching the active tab and the search box, in input order. */
export const filterReports = (reports = [], { tab = 'all', searchTerm = '' } = {}) => {
  if (!Array.isArray(reports)) return [];
  return reports.filter((report) => matchesTab(report, tab) && matchesSearch(report, searchTerm));
};

/**
 * A copy of the reports in the requested order. An unknown `sortBy` keeps the
 * input order, and a report with an unparsable date sorts last in both
 * directions instead of poisoning the comparator with NaN.
 */
export const sortReports = (reports = [], { sortBy = 'date', sortOrder = 'desc' } = {}) => {
  if (!Array.isArray(reports)) return [];
  const direction = sortOrder === 'asc' ? 1 : -1;
  const sorted = [...reports];

  if (sortBy === 'priority') {
    const weight = (report) => PRIORITY_ORDER[report?.priority] ?? 0;
    return sorted.sort((a, b) => (weight(a) - weight(b)) * direction);
  }

  if (sortBy === 'date') {
    return sorted.sort((a, b) => {
      const left = asDate(a?.date);
      const right = asDate(b?.date);
      if (left && right) return (left - right) * direction;
      if (left) return -1;
      if (right) return 1;
      return 0;
    });
  }

  return sorted;
};

/** The reports a Reports view should render for the current controls. */
export const selectReports = (reports, options = {}) =>
  sortReports(filterReports(reports, options), options);

export default selectReports;
