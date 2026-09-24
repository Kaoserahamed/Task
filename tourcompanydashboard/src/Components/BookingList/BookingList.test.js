import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookingList from './BookingList';
import * as toursApi from '../../api/tours';
import * as bookingsApi from '../../api/bookings';

jest.mock('../../socket', () => ({
  __esModule: true,
  default: { on: jest.fn(), emit: jest.fn(), off: jest.fn() },
}));

jest.mock('../../api/tours', () => ({
  fetchTour: jest.fn(),
}));

jest.mock('../../api/bookings', () => ({
  fetchBookingsForTour: jest.fn(),
}));

let mockRouteParams = { tourId: 'tour-1' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockRouteParams,
  useNavigate: () => jest.fn(),
}));

const booking = (overrides = {}) => ({
  _id: 'booking-1',
  bookingReference: 'TB-1001',
  customerName: 'Grace Hopper',
  email: 'grace@example.com',
  phone: '+94 77 111 1111',
  address: 'Galle',
  travelers: 2,
  totalAmount: 500,
  paymentStatus: 'Paid',
  bookingStatus: 'Confirmed',
  bookingDate: '2024-05-01T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = { tourId: 'tour-1' };
  toursApi.fetchTour.mockResolvedValue({
    success: true,
    tour: { _id: 'tour-1', title: 'Kandy Escapade', location: 'Kandy' },
  });
  bookingsApi.fetchBookingsForTour.mockResolvedValue({
    success: true,
    bookings: [booking()],
    totalPages: 1,
  });
});

const renderList = () =>
  render(
    <MemoryRouter>
      <BookingList />
    </MemoryRouter>
  );

test('lists the bookings of a tour with its header', async () => {
  renderList();

  expect(await screen.findByText('Kandy Escapade - Bookings')).toBeInTheDocument();
  expect(screen.getByText('TB-1001')).toBeInTheDocument();
  expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  expect(bookingsApi.fetchBookingsForTour).toHaveBeenCalledWith('tour-1', { page: 1, limit: 10 });
});

test('asks the operator to go back when the tour id is missing', async () => {
  mockRouteParams = { tourId: 'undefined' };

  render(
    <MemoryRouter>
      <BookingList />
    </MemoryRouter>
  );

  expect(await screen.findByText('Invalid tour ID')).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: /Go Back/i })).toBeInTheDocument();
  expect(bookingsApi.fetchBookingsForTour).not.toHaveBeenCalled();
});

test('explains an empty booking list instead of showing a bare table', async () => {
  bookingsApi.fetchBookingsForTour.mockResolvedValue({
    success: true,
    bookings: [],
    totalPages: 1,
  });

  renderList();

  expect(await screen.findByText('No bookings found for this tour')).toBeInTheDocument();
});

test('reports a failed request instead of staying on the spinner', async () => {
  bookingsApi.fetchBookingsForTour.mockResolvedValue({ success: false, message: 'Tour archived' });

  renderList();

  expect(await screen.findByText('Tour archived')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument();
});

test('keeps the page usable when the tour title cannot be read', async () => {
  toursApi.fetchTour.mockRejectedValue(new Error('tour lookup failed'));

  renderList();

  expect(await screen.findByText('TB-1001')).toBeInTheDocument();
});
