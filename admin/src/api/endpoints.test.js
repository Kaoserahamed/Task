/**
 * Endpoint contract: every resource module must hit the path and verb the
 * backend expects. This is the guard that keeps `src/api/` honest.
 */
import * as auth from './auth';
import * as tours from './tours';
import * as bookings from './bookings';
import * as companies from './companies';
import * as chat from './chat';

const lastCall = () => {
  const [url, options] = fetch.mock.calls[fetch.mock.calls.length - 1];
  return { url, options };
};

describe('api endpoint contract', () => {
  beforeEach(() => {
    localStorage.setItem('admin-token', 'jwt');
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: () => Promise.resolve('{}'),
      json: () => Promise.resolve({}),
    });
  });

  test('auth and profile endpoints', async () => {
    await auth.login('a@b.c', 'x');
    expect(lastCall()).toMatchObject({
      url: 'http://localhost:4000/api/admin/login',
      options: { method: 'POST' },
    });

    await auth.signup('a@b.c', 'x');
    expect(lastCall().url).toBe('http://localhost:4000/api/admin/signup');

    await auth.fetchProfile();
    expect(lastCall()).toMatchObject({
      url: 'http://localhost:4000/api/admin/profile',
      options: { method: 'GET' },
    });

    await auth.updateProfile({ name: 'Ada' });
    expect(lastCall().options.method).toBe('POST');

    await auth.changePassword('old', 'new');
    expect(lastCall().url).toBe('http://localhost:4000/api/admin/change-password');

    await auth.updateNotificationSettings({ emailNotifications: true });
    expect(lastCall().url).toBe('http://localhost:4000/api/admin/update-notifications');
  });

  test('tour, booking, company and chat endpoints', async () => {
    await tours.fetchTours();
    expect(lastCall().url).toBe('http://localhost:4000/api/tours');

    await tours.fetchTour('t1');
    expect(lastCall().url).toBe('http://localhost:4000/api/tours/t1');

    await tours.updateTourStatus('t1', { status: 'approved' });
    expect(lastCall()).toMatchObject({
      url: 'http://localhost:4000/api/tours/t1/status',
      options: { method: 'PATCH' },
    });

    await bookings.fetchAllBookings();
    expect(lastCall().url).toBe('http://localhost:4000/api/bookings/all');

    await bookings.fetchBookingsForTour('t1');
    expect(lastCall().url).toBe('http://localhost:4000/api/bookings/tour/t1');

    await companies.fetchCompanies();
    expect(lastCall().url).toBe('http://localhost:4000/api/companies');

    await companies.fetchCompanyRegistrations();
    expect(lastCall().url).toBe('http://localhost:4000/company/auth/companies');

    await companies.updateCompanyStatus({
      companyId: 'c1',
      verificationStatus: 'approved',
      isVerified: true,
    });
    expect(lastCall()).toMatchObject({
      url: 'http://localhost:4000/company/auth/update-status',
      options: { method: 'PATCH' },
    });

    await chat.fetchAdminChats('aduse');
    expect(lastCall().url).toBe('http://localhost:4000/api/chat/get-all-admin-chats?query=aduse');

    await chat.sendMessage({ chatId: 'c1', content: 'hi' });
    expect(lastCall().url).toBe('http://localhost:4000/api/chat/send-message');
  });
});
