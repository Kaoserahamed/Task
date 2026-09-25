const text = (value) => (typeof value === 'string' ? value.trim() : String(value ?? '').trim());

const positiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const validDate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

/**
 * Validate the fields shared by the create and edit tour forms. The backend
 * remains authoritative; this prevents avoidable invalid requests and makes
 * the form feedback accessible before submission.
 */
export function validateTourForm(details = {}) {
  const errors = {};
  const categories = details.packageCategories || [];
  const destinations = details.destinations || [];
  const days = details.duration?.days;
  const nights = details.duration?.nights;
  const startDate = details.startDate;
  const endDate = details.endDate;

  if (!text(details.name)) errors.name = 'Package name is required.';
  if (!details.tourType?.single && !details.tourType?.group) {
    errors.tourType = 'Select at least one tour type.';
  }
  if (categories.length === 0 && !text(details.customCategory)) {
    errors.packageCategories = 'Select a category or enter a custom category.';
  }
  if (!positiveNumber(days)) errors.days = 'Days must be a number greater than zero.';
  if (nights !== '' && !Number.isInteger(Number(nights))) {
    errors.nights = 'Nights must be a whole number.';
  }
  if (Number(nights) < 0) errors.nights = 'Nights cannot be negative.';
  if (!positiveNumber(details.price)) errors.price = 'Price must be greater than zero.';
  if (!text(details.transportation?.type)) {
    errors.transportation = 'Select a transportation type.';
  }
  if (!positiveNumber(details.availableSeats)) {
    errors.availableSeats = 'Available seats must be greater than zero.';
  }
  if (!destinations.length || destinations.some((destination) => !text(destination?.name))) {
    errors.destinations = 'Add a destination name.';
  }
  if (details.tourType?.group && (!validDate(startDate) || !validDate(endDate))) {
    errors.dates = 'Enter a valid start and end date for a group tour.';
  } else if (
    validDate(startDate) &&
    validDate(endDate) &&
    new Date(endDate) < new Date(startDate)
  ) {
    errors.dates = 'End date must be on or after the start date.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    message: Object.values(errors)[0] || '',
  };
}

export default validateTourForm;
