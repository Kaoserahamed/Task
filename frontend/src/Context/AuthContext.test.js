import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

let probe;
const Probe = () => {
  probe = useAuth();
  return null;
};

test('clears the session when the server rejects the stored token', async () => {
  localStorage.setItem(
    'user',
    JSON.stringify({ token: 'stale-jwt', user: { email: 'traveller@example.com' } })
  );
  localStorage.setItem('token', 'stale-jwt');

  global.fetch = jest.fn().mockResolvedValue({
    status: 401,
    ok: false,
    text: () => Promise.resolve(JSON.stringify({ message: 'Invalid token' })),
  });

  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

  await waitFor(() => expect(localStorage.getItem('token')).toBeNull());
  expect(localStorage.getItem('user')).toBeNull();
  expect(probe.user).toBeNull();
});

test('keeps the session on a successful refresh', async () => {
  localStorage.setItem('user', JSON.stringify({ token: 'good-jwt', user: { email: 'a@b.c' } }));
  localStorage.setItem('token', 'good-jwt');

  global.fetch = jest.fn().mockResolvedValue({
    status: 200,
    ok: true,
    text: () =>
      Promise.resolve(JSON.stringify({ success: true, user: { email: 'a@b.c', name: 'Renamed' } })),
  });

  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

  await waitFor(() => expect(probe.user?.user?.name).toBe('Renamed'));
  expect(localStorage.getItem('token')).toBe('good-jwt');
});
