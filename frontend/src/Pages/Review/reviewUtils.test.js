import {
  REVIEW_CHARACTER_LIMIT,
  buildReviewFormData,
  filterCompletedTours,
  findTourById,
  formatReviewDate,
  validateReviewForm,
  validateReviewPhotos,
} from './reviewUtils';

const photo = (type, size) => new File([new Array(size).fill('a').join('')], 'p', { type });

describe('formatReviewDate', () => {
  test('renders a readable date with the year', () => {
    expect(formatReviewDate('2024-05-01T12:00:00.000Z')).toMatch(/2024/);
    expect(formatReviewDate('2024-05-01T12:00:00.000Z')).toMatch(/May/);
  });
});

describe('findTourById', () => {
  const tours = [{ _id: 't1', name: 'Beach' }];

  test('finds a tour and falls back to an empty object', () => {
    expect(findTourById(tours, 't1')).toMatchObject({ name: 'Beach' });
    expect(findTourById(tours, 'missing')).toEqual({});
    expect(findTourById(undefined, 't1')).toEqual({});
  });
});

describe('filterCompletedTours', () => {
  const now = new Date('2026-06-01T10:00:00.000Z');

  test('keeps tours that have ended and drops the rest', () => {
    const tours = [
      { _id: 'past', endDate: '2026-05-01T00:00:00.000Z' },
      { _id: 'future', endDate: '2026-07-01T00:00:00.000Z' },
      { _id: 'unknown' },
    ];

    expect(filterCompletedTours(tours, now).map((tour) => tour._id)).toEqual(['past']);
  });

  test('tolerates a missing list', () => {
    expect(filterCompletedTours(undefined, now)).toEqual([]);
  });
});

describe('validateReviewPhotos', () => {
  test('accepts a supported image under the size limit', () => {
    const result = validateReviewPhotos([photo('image/png', 10)], 0);

    expect(result.accepted).toHaveLength(1);
    expect(result.error).toBeNull();
    expect(result.limitExceeded).toBe(false);
  });

  test('rejects an unsupported format with a message', () => {
    const result = validateReviewPhotos([photo('application/pdf', 10)], 0);

    expect(result.accepted).toHaveLength(0);
    expect(result.error).toMatch(/JPG, JPEG, and PNG/);
  });

  test('rejects a file larger than 5MB', () => {
    const result = validateReviewPhotos([photo('image/jpeg', 6 * 1024 * 1024)], 0);

    expect(result.accepted).toHaveLength(0);
    expect(result.error).toMatch(/smaller than 5MB/);
  });

  test('flags the selection that would exceed five images', () => {
    const result = validateReviewPhotos([photo('image/png', 10)], 5);

    expect(result.accepted).toEqual([]);
    expect(result.limitExceeded).toBe(true);
    expect(result.error).toMatch(/maximum of 5 images/);
  });
});

describe('validateReviewForm', () => {
  const valid = { selectedTour: 't1', userName: 'Ada', rating: 4, reviewText: 'Great' };

  test('passes a complete review', () => {
    expect(validateReviewForm(valid)).toEqual({});
  });

  test('reports every missing field', () => {
    const errors = validateReviewForm({
      selectedTour: '',
      userName: '  ',
      rating: 0,
      reviewText: '',
    });

    expect(errors).toEqual({
      tour: 'Please select a tour',
      userName: 'Please enter your name',
      rating: 'Please provide a rating',
    });
  });

  test('caps the review text length', () => {
    const errors = validateReviewForm({
      ...valid,
      reviewText: 'x'.repeat(REVIEW_CHARACTER_LIMIT + 1),
    });

    expect(errors.reviewText).toBe('Review text cannot exceed 1000 characters');
  });
});

describe('buildReviewFormData', () => {
  test('sends the review fields and appends each photo file', () => {
    const file = photo('image/png', 4);
    const formData = buildReviewFormData({
      tourId: 't1',
      userName: 'Ada',
      rating: 5,
      reviewText: 'Lovely',
      photos: [{ file }],
    });

    expect(formData.get('tourId')).toBe('t1');
    expect(formData.get('userName')).toBe('Ada');
    expect(formData.get('rating')).toBe('5');
    expect(formData.get('comment')).toBe('Lovely');
    expect(formData.getAll('photos')).toHaveLength(1);
  });
});
