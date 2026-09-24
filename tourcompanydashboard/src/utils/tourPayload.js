import { EMPTY_DESTINATION, createTourFormState } from '../constants/tourForm';

/**
 * Tour payload helpers for the company dashboard forms.
 *
 * The edit form used to normalise the API response and build the multipart body
 * inline in the component. Both are pure functions over the tour object, so they
 * live here, stay covered by tests, and no longer need to be re-read every time
 * the JSX around them changes.
 */

const EMPTY_MEALS = { breakfast: false, lunch: false, dinner: false };
const EMPTY_TRANSPORTATION = { type: '', details: '' };
const EMPTY_TOUR_TYPE = { single: false, group: false };
const EMPTY_WEATHER = { city: '', condition: '', temp: '' };

const asArrayOr = (value, fallback) =>
  Array.isArray(value) && value.length > 0 ? value : fallback;

const asObjectOr = (value, fallback) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;

/** `2024-05-01T00:00:00.000Z` → `2024-05-01` for a date input. */
const toDateInputValue = (value) => (typeof value === 'string' && value ? value.split('T')[0] : '');

/** Normalise an API tour into the shape the edit form expects. */
export function toEditableTour(tour) {
  const source = tour && typeof tour === 'object' ? tour : {};

  return createTourFormState({
    ...source,
    startDate: toDateInputValue(source.startDate),
    endDate: toDateInputValue(source.endDate),
    packageCategories: Array.isArray(source.packageCategories) ? source.packageCategories : [],
    customCategory: source.customCategory || '',
    tourType: asObjectOr(source.tourType, EMPTY_TOUR_TYPE),
    meals: asObjectOr(source.meals, EMPTY_MEALS),
    transportation: asObjectOr(source.transportation, EMPTY_TRANSPORTATION),
    destinations: asArrayOr(source.destinations, [{ ...EMPTY_DESTINATION }]),
    images: Array.isArray(source.images) ? source.images : [],
    includes: asArrayOr(source.includes, ['']),
    excludes: asArrayOr(source.excludes, ['']),
    weather: asObjectOr(source.weather, EMPTY_WEATHER),
  });
}

/**
 * Build the multipart body for `PUT /api/tours/:id`.
 *
 * New `File` values travel as `newImages`; anything already stored is sent as a
 * JSON `existingImages` list, so the server keeps exactly those images.
 */
export function buildTourUpdateFormData(tourDetails) {
  const formData = new FormData();

  Object.keys(tourDetails).forEach((key) => {
    if (key === 'images') {
      tourDetails.images.forEach((image) => {
        if (image instanceof File) {
          formData.append('newImages', image);
        }
      });
      formData.append(
        'existingImages',
        JSON.stringify(tourDetails.images.filter((image) => !(image instanceof File)))
      );
    } else if (typeof tourDetails[key] === 'object') {
      formData.append(key, JSON.stringify(tourDetails[key]));
    } else {
      formData.append(key, tourDetails[key]);
    }
  });

  return formData;
}
