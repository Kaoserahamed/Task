/**
 * Endpoint contract: every resource module must hit the path and verb the
 * backend expects. This is the guard that keeps `src/api/` honest.
 */
import * as auth from './auth';
import * as tours from './tours';
import * as bookings from './bookings';
import * as reviews from './reviews';
import * as chat from './chat';
import * as wishlist from './wishlist';
import * as companies from './companies';
import * as places from './places';
import * as weather from './weather';
import * as suggestions from './suggestions';

const lastCall = () => {
  const [url, options] = fetch.mock.calls[fetch.mock.calls.length - 1];
  return { url, options };
};

describe('api endpoint contract', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'jwt');
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: () => Promise.resolve('{}'),
      json: () => Promise.resolve({}),
    });
  });

  test('auth endpoints', async () => {
    await auth.login({ email: 'a@b.c', password: 'x' });
    expect(lastCall()).toMatchObject({
      url: 'http://localhost:4000/user/auth/login',
      options: { method: 'POST' },
    });

    await auth.register({ name: 'Ada', email: 'a@b.c', password: 'x' });
    expect(lastCall().url).toBe('http://localhost:4000/user/auth/register');

    await auth.fetchCurrentUser();
    expect(lastCall()).toMatchObject({
      url: 'http://localhost:4000/user/auth/me',
      options: { method: 'GET' },
    });

    await auth.updateProfile({ name: 'Ada' });
    expect(lastCall().options.method).toBe('PUT');

    await auth.uploadAvatar(new FormData());
    expect(lastCall().options.method).toBe('POST');
    expect(lastCall().options.body).toBeInstanceOf(FormData);

    await auth.requestPasswordReset('a@b.c', 'https://app/reset');
    expect(lastCall().url).toBe('http://localhost:4000/user/auth/reset');

    await auth.resetPassword('tok', 'new-secret');
    expect(lastCall().url).toBe('http://localhost:4000/user/auth/reset-password');
  });

  test('tour and booking endpoints', async () => {
    await tours.fetchApprovedTours();
    expect(lastCall().url).toBe('http://localhost:4000/api/tours/approved');

    await tours.fetchTour('t1');
    expect(lastCall().url).toBe('http://localhost:4000/api/tours/t1');

    await tours.incrementTourView('t1');
    expect(lastCall()).toMatchObject({
      url: 'http://localhost:4000/api/tours/t1/increment-view',
      options: { method: 'PATCH' },
    });

    await tours.bookSeats('t1', 3);
    expect(lastCall().options.body).toBe(JSON.stringify({ seatsToBook: 3 }));

    await bookings.fetchMyBookings('a@b.c');
    expect(lastCall().url).toBe('http://localhost:4000/api/bookings?email=a%40b.c');

    await bookings.createBooking({ tourId: 't1' });
    expect(lastCall().url).toBe('http://localhost:4000/api/bookings/add');
  });

  test('review, chat and directory endpoints', async () => {
    await reviews.fetchReviews();
    expect(lastCall().url).toBe('http://localhost:4000/reviews');

    await reviews.fetchTourReviews('t1');
    expect(lastCall().url).toBe('http://localhost:4000/reviews/tour/t1');

    await reviews.createReview(new FormData());
    expect(lastCall().options.body).toBeInstanceOf(FormData);

    await chat.fetchUserChats('u1', 'comuse');
    expect(lastCall().url).toBe('http://localhost:4000/api/chat/get-user-chat/u1?query=comuse');

    await chat.fetchChatMessages('c1', 'adcom');
    expect(lastCall().url).toBe('http://localhost:4000/api/chat/get-chat/c1?query=adcom');

    await chat.sendMessage({ chatId: 'c1', content: 'hi' });
    expect(lastCall().url).toBe('http://localhost:4000/api/chat/send-message');

    await companies.searchCompanies('trek & co');
    expect(lastCall().url).toBe('http://localhost:4000/company/auth/search?query=trek%20%26%20co');
  });

  test('wishlist, places, weather and suggestion endpoints', async () => {
    await wishlist.fetchWishlist('a@b.c');
    expect(lastCall().url).toBe('http://localhost:4000/api/wishlist?email=a%40b.c');

    await wishlist.addToWishlist('t1', 'a@b.c');
    expect(lastCall()).toMatchObject({
      url: 'http://localhost:4000/api/wishlist/add',
      options: { method: 'POST' },
    });

    await wishlist.removeFromWishlist('t1', 'a@b.c');
    expect(lastCall()).toMatchObject({
      url: 'http://localhost:4000/api/wishlist/remove/t1',
      options: { method: 'DELETE' },
    });

    await places.fetchHotels();
    expect(lastCall().url).toBe('http://localhost:4000/api/hotels');

    await places.fetchRestaurants();
    expect(lastCall().url).toBe('http://localhost:4000/api/restaurants');

    await weather.fetchWeather('Dhaka');
    expect(lastCall().url).toBe('http://localhost:4000/api/weather/Dhaka');

    await suggestions.fetchSuggestions('Dhaka');
    expect(lastCall().url).toBe('http://localhost:4000/Suggestion/Dhaka');
  });
});
