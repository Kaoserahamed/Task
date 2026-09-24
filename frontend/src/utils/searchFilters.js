export const TOUR_TYPE_OPTIONS = [
  { id: 'adventure', name: 'Adventure', icon: 'mountain', color: '#f97316' },
  { id: 'Family', name: 'Family', icon: 'users', color: '#0ea5e9' },
  { id: 'cultural', name: 'Cultural', icon: 'landmark', color: '#8b5cf6' },
  { id: 'Educational', name: 'Educational', icon: 'graduation-cap', color: '#ec4899' },
  { id: 'Nature & Eco', name: 'Nature & Eco', icon: 'tree', color: '#22c55e' },
  { id: 'Honeymoon', name: 'Honeymoon', icon: 'heart', color: '#f43f5e' },
  { id: 'Seasonal', name: 'Seasonal', icon: 'calendar', color: '#f59e0b' },
  { id: 'Religious', name: 'Religious', icon: 'place-of-worship', color: '#6366f1' },
  { id: 'Beach', name: 'Beach', icon: 'umbrella-beach', color: '#06b6d4' },
  { id: 'Historical', name: 'Historical', icon: 'monument', color: '#84cc16' },
];

export const DURATION_OPTIONS = [
  { id: '1-2', label: '1-2 Days' },
  { id: '3-5', label: '3-5 Days' },
  { id: '6-10', label: '6-10 Days' },
  { id: '10+', label: '10+ Days' },
];

export const STATUS_OPTIONS = [
  { id: 'upcoming', label: 'Upcoming', color: '#0ea5e9' },
  { id: 'ongoing', label: 'Ongoing', color: '#22c55e' },
  { id: 'completed', label: 'Completed', color: '#6b7280' },
];

export const DEFAULT_FILTERS = {
  query: '',
  priceMax: 1000,
  tourTypes: [],
  durations: [],
  statuses: [],
  sort: 'lowest',
};

export const parseSearchFilters = (searchParams) => ({
  query: searchParams.get('query') || DEFAULT_FILTERS.query,
  priceMax: Number.parseInt(searchParams.get('priceMax') || DEFAULT_FILTERS.priceMax, 10),
  tourTypes: searchParams.getAll('tourType') || [],
  durations: searchParams.getAll('duration') || [],
  statuses: searchParams.getAll('status') || [],
  sort: searchParams.get('sort') || DEFAULT_FILTERS.sort,
});

export const aggregateReviews = (reviews = []) => {
  const totals = {};
  const counts = {};

  for (const review of reviews) {
    const tourId = review.tourId;
    if (!tourId) continue;
    totals[tourId] = (totals[tourId] || 0) + Number(review.rating || 0);
    counts[tourId] = (counts[tourId] || 0) + 1;
  }

  return {
    averages: Object.fromEntries(
      Object.entries(totals).map(([tourId, total]) => [tourId, total / counts[tourId]])
    ),
    counts,
  };
};

export const getTourStatus = (tour, now = new Date()) => {
  if (!tour?.startDate || !tour?.endDate) return 'upcoming';

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(tour.startDate);
  const endDate = new Date(tour.endDate);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  if (today < startDate) return 'upcoming';
  if (today <= endDate) return 'ongoing';
  return 'completed';
};

export const matchesSearchQuery = (tour, query) => {
  if (!query) return true;
  const term = query.toLowerCase().trim();
  if (!term) return true;

  return (
    [tour.name, tour.description, tour.shortDescription, tour.tourGuide?.name].some((value) =>
      value?.toLowerCase().includes(term)
    ) ||
    tour.destinations?.some(
      (destination) =>
        destination.name?.toLowerCase().includes(term) ||
        destination.description?.toLowerCase().includes(term)
    ) ||
    tour.packageCategories?.some((category) => category.toLowerCase().includes(term))
  );
};

export const matchesTourType = (tour, selectedTypes) => {
  if (!selectedTypes.length) return true;
  if (tour.packageCategories?.some((category) => selectedTypes.includes(category))) return true;

  const typeFields = {
    adventure: 'adventure',
    Family: 'family',
    cultural: 'cultural',
    Educational: 'educational',
    'Nature & Eco': 'natureEco',
    Honeymoon: 'honeymoon',
    Seasonal: 'seasonal',
    Religious: 'religious',
    Beach: 'beach',
    Historical: 'historical',
  };

  return selectedTypes.some((type) => tour.tourType?.[typeFields[type]]);
};

export const matchesDuration = (tour, durations) => {
  if (!durations.length) return true;
  const days = tour.duration?.days || 0;
  return durations.some((duration) => {
    if (duration === '1-2') return days >= 1 && days <= 2;
    if (duration === '3-5') return days >= 3 && days <= 5;
    if (duration === '6-10') return days >= 6 && days <= 10;
    if (duration === '10+') return days > 10;
    return false;
  });
};

export const filterAndSortTours = ({
  tours = [],
  query = '',
  priceMax = DEFAULT_FILTERS.priceMax,
  tourTypes = [],
  durations = [],
  statuses = [],
  sort = DEFAULT_FILTERS.sort,
  averageRatings = {},
  reviewCounts = {},
  now = new Date(),
}) =>
  [...tours]
    .filter((tour) => matchesSearchQuery(tour, query))
    .filter((tour) => (tour.price || 0) <= priceMax)
    .filter((tour) => matchesTourType(tour, tourTypes))
    .filter((tour) => matchesDuration(tour, durations))
    .filter((tour) => !statuses.length || statuses.includes(getTourStatus(tour, now)))
    .sort((a, b) => {
      if (sort === 'highest') return (b.price || 0) - (a.price || 0);
      if (sort === 'duration') return (b.duration?.days || 0) - (a.duration?.days || 0);
      if (sort === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sort === 'rating') {
        const ratingDifference = (averageRatings[b._id] || 0) - (averageRatings[a._id] || 0);
        return ratingDifference || (reviewCounts[b._id] || 0) - (reviewCounts[a._id] || 0);
      }
      return (a.price || 0) - (b.price || 0);
    });

export const formatPrice = (price) => `$${(price || 0).toLocaleString()}`;
export const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString('en-GB') : 'TBA';

export const getImageUrl = (imagePath, apiBaseUrl) => {
  if (!imagePath) return 'https://via.placeholder.com/300x200?text=No+Image';
  if (imagePath.startsWith('http')) return imagePath;
  return `${apiBaseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
};
