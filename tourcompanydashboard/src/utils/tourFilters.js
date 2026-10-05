/**
 * Pure selectors for the company dashboard's Manage Tours filters.
 * Keeping these rules outside the component makes the filter contract easy to
 * test and prevents category/type parsing from drifting with JSX changes.
 */

/**
 * Parse a stored `packageCategories` value into a flat list of category names.
 *
 * The field has been persisted in three shapes over the life of the project: a
 * real array, a JSON-encoded array (`'["Beach","Nature"]'`), and a
 * bracket-wrapped comma list (`'[Beach, Nature]'`) written by older clients and
 * by seed data. All three have to resolve to the same names, otherwise a tour
 * silently disappears from the category filters an operator is looking at.
 *
 * The bracket-stripping branch used to sit after the JSON branch and was
 * unreachable, because every string starting with `[` entered the `try` and then
 * returned from the `catch`. That made the third shape parse as *no* categories.
 */
const parseCategoryString = (value) => {
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Not valid JSON. Fall through to the bracket-stripping split below rather
      // than discarding the value: `'[Beach, Nature]'` is a list, not junk.
    }
  }

  return trimmed
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((category) => category.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
};

export const normalizePackageCategories = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((category) => {
      if (typeof category === 'string') return parseCategoryString(category);
      return category == null ? [] : [String(category)];
    });
  }
  return parseCategoryString(value);
};

export const matchesTourCategory = (tour, category = 'all') => {
  if (category === 'all') return true;
  if (category === 'custom') return Boolean(tour?.customCategory?.trim());
  const expected = category.toLowerCase();
  return normalizePackageCategories(tour?.packageCategories).some(
    (value) => value.toLowerCase() === expected
  );
};

export const matchesTourType = (tour, type = 'all') => {
  if (type === 'all') return true;
  return tour?.tourType?.[type] === true;
};

export const filterCompanyTours = (tours = [], { category = 'all', type = 'all' } = {}) => {
  if (!Array.isArray(tours)) return [];
  return tours.filter((tour) => matchesTourCategory(tour, category) && matchesTourType(tour, type));
};

export default filterCompanyTours;
