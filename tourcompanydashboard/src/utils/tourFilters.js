/**
 * Pure selectors for the company dashboard's Manage Tours filters.
 * Keeping these rules outside the component makes the filter contract easy to
 * test and prevents category/type parsing from drifting with JSX changes.
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
      return [];
    }
  }

  return trimmed
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((category) => category.trim())
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
