/**
 * Endpoint contract: every resource module must hit the path and verb the
 * backend expects. This is the guard that keeps `src/api/` honest.
 */
import * as auth from './auth';
import * as tours from './tours';
import * as bookings from './bookings';
import * as chat from './chat';
import * as users from './users';

const lastCall = () => {
  const [url, options] = fetch.mock.calls[fetch.mock.calls.length - 1];
  return { url, options };
};

describe('api endpoint contract', () => {
  beforeEach(() => {
    localStorage.setItem('company-token', 'jwt');
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
      url: 'http://localhost:4000/company/auth/login',
      options: { method: 'POST' },
    });

    await auth.register({ name: 'Contoso', email: 'a@b.c', password: 'x' });
    expect(lastCall().url).toBe('http://localhost:4000/company/auth/register');

    await auth.fetchCompanyRegistrations();
    expect(lastCall().url).toBe('http://localhost:4000/company/auth/companies');

    await auth.fetchCompanyById('c1');
    expect(lastCall().url).toBe('http://localhost:4000/api/company/c1');

    await auth.updateCompanyInfo({ name: 'Contoso' });
    expect(lastCall()).toMatchObject({
      url: 'http://localhost:4000/company/auth/update-info',
      options: { method: 'PATCH' },
    });

    await auth.verifyPassword('pw');
    expect(lastCall().url).toBe('http://localhost:4000/company/auth/verify-password');

    await auth.requestPasswordReset('a@b.c', 'https://app/reset');
    expect(lastCall().url).toBe('http://localhost:4000/company/auth/reset');

    await auth.resetPassword('tok', 'new-secret');
    expect(lastCall().url).toBe('http://localhost:4000/company/auth/reset-password');
  });

  test('tour, booking, chat and search endpoints', async () => {
    await tours.fetchTours();
    expect(lastCall().url).toBe('http://localhost:4000/api/tours');

    await tours.fetchCompanyTours('c1');
    expect(lastCall().url).toBe('http://localhost:4000/api/companytours/c1');

    await tours.fetchTour('t1');
    expect(lastCall().url).toBe('http://localhost:4000/api/tours/t1');

    await tours.createTour(new FormData());
    expect(lastCall()).toMatchObject({
      url: 'http://localhost:4000/api/tours',
      options: { method: 'POST' },
    });

    await tours.updateTour('t1', new FormData());
    expect(lastCall().options.method).toBe('PUT');

    await tours.deleteTour('t1');
    expect(lastCall().options.method).toBe('DELETE');

    await tours.updateTourStatus('t1', 'approved');
    expect(lastCall()).toMatchObject({
      url: 'http://localhost:4000/api/tours/t1/status',
      options: { method: 'PATCH' },
    });

    await bookings.fetchBookingsForTour('t1', { page: 2, limit: 10 });
    expect(lastCall().url).toBe('http://localhost:4000/api/bookings/tour/t1?page=2&limit=10');

    await bookings.fetchAllBookings();
    expect(lastCall().url).toBe('http://localhost:4000/api/bookings/admin/all');

    await chat.fetchChats('c1', 'adcom');
    expect(lastCall().url).toBe('http://localhost:4000/api/chat/get-chat/c1?query=adcom');

    await chat.sendMessage({ chatId: 'c1', content: 'hi' });
    expect(lastCall().url).toBe('http://localhost:4000/api/chat/send-message');

    await users.searchUsers('ada');
    expect(lastCall().url).toBe('http://localhost:4000/user/auth/search?query=ada');
  });
});
