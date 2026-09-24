import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PackageGrid from './PackageGrid';
import * as toursApi from '../../api/tours';
import * as reviewsApi from '../../api/reviews';

const mockNavigate = jest.fn();

jest.mock('../../api/tours', () => ({
  incrementTourView: jest.fn(),
}));

jest.mock('../../api/reviews', () => ({
  fetchReviews: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const tour = (overrides = {}) => ({
  _id: 'tour-1',
  name: 'Kandy Escapade',
  price: 250,
  images: ['https://cdn.example/kandy.jpg'],
  packageCategories: 'Heritage',
  startDate: '2999-01-01',
  popularity: { rating: { average: 4.2 } },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  reviewsApi.fetchReviews.mockResolvedValue([]);
  toursApi.incrementTourView.mockResolvedValue({ success: true });
});

test('explains itself instead of rendering an empty grid', () => {
  render(
    <MemoryRouter>
      <PackageGrid packages={[]} />
    </MemoryRouter>
  );

  expect(screen.getByText(/No packages found for this category/i)).toBeInTheDocument();
  expect(reviewsApi.fetchReviews).not.toHaveBeenCalled();
});

test('averages the review ratings of each tour', async () => {
  reviewsApi.fetchReviews.mockResolvedValue([
    { tourId: 'tour-1', rating: 5 },
    { tourId: 'tour-1', rating: 3 },
  ]);

  render(
    <MemoryRouter>
      <PackageGrid packages={[tour()]} />
    </MemoryRouter>
  );

  // (5 + 3) / 2, replacing the seeded popularity average of 4.2
  expect(await screen.findByText('4.0 / 5')).toBeInTheDocument();
});

test('counts the view and opens the detail page', async () => {
  render(
    <MemoryRouter>
      <PackageGrid packages={[tour()]} />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('link', { name: /Explore Now/i }));

  await waitFor(() => expect(toursApi.incrementTourView).toHaveBeenCalledWith('tour-1'));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/package/tour-1'));
});

test('still opens the detail page when the view counter fails', async () => {
  toursApi.incrementTourView.mockRejectedValue(new Error('view counter down'));

  render(
    <MemoryRouter>
      <PackageGrid packages={[tour()]} />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('link', { name: /Explore Now/i }));

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/package/tour-1'));
});

test('marks a tour whose start date has passed as completed', async () => {
  render(
    <MemoryRouter>
      <PackageGrid packages={[tour({ startDate: '2020-01-01' })]} />
    </MemoryRouter>
  );

  expect(await screen.findByText('Completed')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Explore Now \(Tour Ended\)/i })).toBeInTheDocument();
});

test('survives a review service outage', async () => {
  reviewsApi.fetchReviews.mockRejectedValue(new Error('reviews down'));

  render(
    <MemoryRouter>
      <PackageGrid packages={[tour()]} />
    </MemoryRouter>
  );

  expect(await screen.findByText('Kandy Escapade')).toBeInTheDocument();
  expect(screen.getByText('4.2 / 5')).toBeInTheDocument();
});
