export const PACKAGE_CATEGORIES = [
  'Adventure',
  'Cultural',
  'Nature & Eco',
  'Family',
  'Honeymoon',
  'Educational',
  'Seasonal',
];

export const TRANSPORTATION_TYPES = ['Bus', 'Mini Bus', 'Car', 'Premium Car', 'Other'];

export const WEATHER_CONDITIONS = [
  'Sunny',
  'Partly Cloudy',
  'Cloudy',
  'Rainy',
  'Stormy',
  'Snowy',
  'Foggy',
  'Hot',
  'Cold',
  'Mild',
];

export const EMPTY_DESTINATION = {
  name: '',
  description: '',
  stayDuration: '',
};

const DEFAULT_TOUR_FORM = {
  name: '',
  packageCategories: [],
  customCategory: '',
  tourType: { single: false, group: false },
  duration: { days: '', nights: '' },
  startDate: '',
  endDate: '',
  meals: { breakfast: false, lunch: false, dinner: false },
  transportation: { type: '', details: '' },
  tourGuide: false,
  price: '',
  maxGroupSize: '',
  availableSeats: '',
  destinations: [{ ...EMPTY_DESTINATION }],
  images: [],
  includes: [''],
  excludes: [''],
  specialNote: '',
  cancellationPolicy: '',
  weather: { city: '', condition: '', temp: '' },
};

export const createTourFormState = (overrides = {}) => ({
  ...DEFAULT_TOUR_FORM,
  ...overrides,
  tourType: { ...DEFAULT_TOUR_FORM.tourType, ...overrides.tourType },
  duration: { ...DEFAULT_TOUR_FORM.duration, ...overrides.duration },
  meals: { ...DEFAULT_TOUR_FORM.meals, ...overrides.meals },
  transportation: { ...DEFAULT_TOUR_FORM.transportation, ...overrides.transportation },
  weather: { ...DEFAULT_TOUR_FORM.weather, ...overrides.weather },
});
