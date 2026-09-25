/**
 * Pure helpers for the review page.
 *
 * The page used to carry its date formatting, completed-tour filter, photo
 * validation and multipart assembly inline, which made the component the only
 * place any of the rules could be read or exercised. They live here now.
 */

export const REVIEW_CHARACTER_LIMIT = 1000;
export const REVIEW_MAX_PHOTOS = 5;
export const REVIEW_MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const REVIEW_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export function formatReviewDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

export function findTourById(tours, id) {
  return (tours || []).find((tour) => tour._id === id) || {};
}

/** Tours whose end date is before today; dates are normalised to midnight. */
export function filterCompletedTours(tours, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return (tours || []).filter((tour) => {
    if (!tour.endDate) return false;
    const endDate = new Date(tour.endDate);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today;
  });
}

/**
 * Split picked files into `accepted` ones and an error message.
 *
 * `limitExceeded` is explicit because the page keeps the current selection and
 * leaves the file input untouched in that case, exactly as the inline version
 * did.
 */
export function validateReviewPhotos(files, currentCount = 0) {
  const selected = Array.from(files || []);
  let error = null;

  const accepted = selected.filter((file) => {
    if (!REVIEW_PHOTO_TYPES.includes(file.type)) {
      error = 'Only JPG, JPEG, and PNG formats are allowed.';
      return false;
    }
    if (file.size > REVIEW_MAX_PHOTO_BYTES) {
      error = 'Files must be smaller than 5MB.';
      return false;
    }
    return true;
  });

  if (currentCount + accepted.length > REVIEW_MAX_PHOTOS) {
    return {
      accepted: [],
      error: `You can upload a maximum of ${REVIEW_MAX_PHOTOS} images.`,
      limitExceeded: true,
    };
  }

  return { accepted, error, limitExceeded: false };
}

/** Field-level validation for the review form; an empty object means valid. */
export function validateReviewForm({ selectedTour, userName, rating, reviewText }) {
  const errors = {};

  if (!selectedTour) {
    errors.tour = 'Please select a tour';
  }
  if (!String(userName || '').trim()) {
    errors.userName = 'Please enter your name';
  }
  if (!rating || rating === 0) {
    errors.rating = 'Please provide a rating';
  }
  if (String(reviewText || '').length > REVIEW_CHARACTER_LIMIT) {
    errors.reviewText = `Review text cannot exceed ${REVIEW_CHARACTER_LIMIT} characters`;
  }

  return errors;
}

export function buildReviewFormData({ tourId, userName, rating, reviewText, photos }) {
  const formData = new FormData();

  formData.append('tourId', tourId);
  formData.append('userName', userName);
  formData.append('rating', rating);
  formData.append('comment', reviewText);
  (photos || []).forEach((photo) => formData.append('photos', photo.file));

  return formData;
}
