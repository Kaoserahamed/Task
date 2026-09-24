import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Wishlist from './Wishlist';
import { useAuth } from '../../Context/AuthContext';
import * as toursApi from '../../api/tours';
import * as wishlistApi from '../../api/wishlist';

const mockNavigate = jest.fn();

jest.mock('../../Context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../api/tours', () => ({
  incrementTourView: jest.fn(),
}));

jest.mock('../../api/wishlist', () => ({
  fetchWishlist: jest.fn(),
  removeFromWishlist: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const signedIn = () => useAuth.mockReturnValue({ user: { user: { email: 'ada@example.com' } } });

const wishlistEntry = {
  _id: 'wish-1',
  tourId: {
    _id: 'tour-1',
    name: 'Kandy Escapade',
    images: ['kandy.jpg'],
    destinations: [{ name: 'Kandy' }],
    duration: { days: 3, nights: 2 },
    price: 250,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  useAuth.mockReturnValue({ user: null });
  toursApi.incrementTourView.mockResolvedValue({ success: true });
  wishlistApi.fetchWishlist.mockResolvedValue({ wishlist: [wishlistEntry] });
  wishlistApi.removeFromWishlist.mockResolvedValue({ success: true });
});

test('asks an anonymous visitor to sign in and calls nothing', () => {
  localStorage.setItem('token', 'jwt');

  render(
    <MemoryRouter>
      <Wishlist />
    </MemoryRouter>
  );

  expect(wishlistApi.fetchWishlist).not.toHaveBeenCalled();
});

test('asks a tokenless visitor to sign in', () => {
  render(
    <MemoryRouter>
      <Wishlist />
    </MemoryRouter>
  );

  expect(wishlistApi.fetchWishlist).not.toHaveBeenCalled();
});

test('lists the saved tours for the signed-in traveller', async () => {
  localStorage.setItem('token', 'jwt');
  signedIn();

  render(
    <MemoryRouter>
      <Wishlist />
    </MemoryRouter>
  );

  expect(await screen.findByText('Kandy Escapade')).toBeInTheDocument();
  expect(wishlistApi.fetchWishlist).toHaveBeenCalledWith('ada@example.com');
  expect(screen.getByText('3 Days, 2 Nights')).toBeInTheDocument();
});

test('removes a saved tour through the api layer', async () => {
  localStorage.setItem('token', 'jwt');
  signedIn();

  render(
    <MemoryRouter>
      <Wishlist />
    </MemoryRouter>
  );

  await screen.findByText('Kandy Escapade');
  fireEvent.click(screen.getByRole('button', { name: 'Remove Kandy Escapade from wishlist' }));

  await waitFor(() =>
    expect(wishlistApi.removeFromWishlist).toHaveBeenCalledWith('tour-1', 'ada@example.com')
  );
  await waitFor(() => expect(screen.queryByText('Kandy Escapade')).not.toBeInTheDocument());
});

test('counts the view before opening a saved tour', async () => {
  localStorage.setItem('token', 'jwt');
  signedIn();

  render(
    <MemoryRouter>
      <Wishlist />
    </MemoryRouter>
  );

  fireEvent.click(await screen.findByRole('button', { name: /View Details/i }));

  await waitFor(() => expect(toursApi.incrementTourView).toHaveBeenCalledWith('tour-1'));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/package/tour-1'));
});
