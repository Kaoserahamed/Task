import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as toursApi from '../../api/tours';
import UploadTour from './UploadTour';

const mockNavigate = jest.fn();
const mockUseTourForm = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../Context/AuthContext', () => ({
  useAuth: () => ({ company: { company: { _id: 'company-1', name: 'Contoso Tours' } } }),
}));

jest.mock('../../api/tours', () => ({ createTour: jest.fn() }));
jest.mock('../../hooks/useTourForm', () => ({
  useTourForm: (...args) => mockUseTourForm(...args),
}));

const validTour = {
  name: 'Hill Weekend',
  packageCategories: ['Nature & Eco'],
  customCategory: '',
  tourType: { single: false, group: true },
  duration: { days: 2, nights: 1 },
  startDate: '2026-07-01',
  endDate: '2026-07-02',
  meals: { breakfast: true, lunch: false, dinner: false },
  transportation: { type: 'Bus', details: 'Coach' },
  tourGuide: true,
  price: '450',
  maxGroupSize: '12',
  availableSeats: '10',
  destinations: [{ name: 'Sylhet', description: 'Tea trails', stayDuration: '1 day' }],
  images: [],
  includes: ['Breakfast'],
  excludes: [],
  specialNote: '',
  cancellationPolicy: '',
  weather: { city: 'Sylhet', condition: 'Sunny', temp: '28' },
};

const formResult = (details = validTour) => ({
  tourDetails: details,
  setTourDetails: jest.fn(),
  packageCategories: ['Nature & Eco'],
  transportationTypes: ['Bus'],
  weatherConditions: ['Sunny'],
  handleChange: jest.fn(),
  handleDurationChange: jest.fn(),
  handleMealChange: jest.fn(),
  handleTransportationChange: jest.fn(),
  handleWeatherChange: jest.fn(),
  handleArrayFieldChange: jest.fn(),
  addArrayField: jest.fn(),
  handleDestinationsChange: jest.fn(),
  addDestination: jest.fn(),
  handleFileChange: jest.fn(),
  handleCategoryChange: jest.fn(),
  handleRemoveImage: jest.fn(),
  imageError: '',
  clearImageError: jest.fn(),
});

const submit = () => fireEvent.submit(screen.getByRole('form', { name: 'Create tour package' }));

describe('UploadTour', () => {
  beforeEach(() => {
    mockUseTourForm.mockReturnValue(formResult());
    toursApi.createTour.mockResolvedValue({ success: true });
  });

  test('builds the multipart request and navigates after a successful upload', async () => {
    render(<UploadTour />);

    submit();

    await waitFor(() => expect(toursApi.createTour).toHaveBeenCalledTimes(1));
    const payload = toursApi.createTour.mock.calls[0][0];
    expect(payload).toBeInstanceOf(FormData);
    expect(payload.get('companyId')).toBe('company-1');
    expect(JSON.parse(payload.get('tourType'))).toEqual({ single: false, group: true });
    expect(mockNavigate).toHaveBeenCalledWith('/manage-tours');
  });

  test('shows the API error and remains on the form after a failed upload', async () => {
    toursApi.createTour.mockRejectedValue(new Error('Network unavailable'));
    render(<UploadTour />);

    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to upload tour: Network unavailable'
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('blocks invalid form data before calling the API', () => {
    mockUseTourForm.mockReturnValue(formResult({ ...validTour, name: '', destinations: [] }));
    render(<UploadTour />);

    submit();

    expect(screen.getByRole('alert')).toHaveTextContent('Package name is required.');
    expect(toursApi.createTour).not.toHaveBeenCalled();
  });
});
