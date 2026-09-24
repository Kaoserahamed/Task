import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';

const tokenFor = (user) => {
  const payload = btoa(JSON.stringify(user)).replace(/=/g, '');
  return `header.${payload}.signature`;
};

let probe;
const Probe = () => {
  probe = useAuth();
  return <div>{probe.loading ? 'loading' : probe.user ? probe.user.name : 'anonymous'}</div>;
};

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

beforeEach(() => {
  localStorage.clear();
  probe = undefined;
});

test('restores an admin session from a valid token', async () => {
  localStorage.setItem('admin-token', tokenFor({ name: 'Ada Admin', isAdmin: true }));

  renderProvider();

  expect(await screen.findByText('Ada Admin')).toBeInTheDocument();
  expect(probe.user).toMatchObject({ name: 'Ada Admin', isAdmin: true });
  expect(probe.loading).toBe(false);
});

test('removes an invalid token and exposes an anonymous session', async () => {
  localStorage.setItem('admin-token', 'not-a-jwt');

  renderProvider();

  expect(await screen.findByText('anonymous')).toBeInTheDocument();
  expect(localStorage.getItem('admin-token')).toBeNull();
  expect(probe.user).toBeNull();
});

test('logs in, persists a token, and logs out', async () => {
  renderProvider();
  await screen.findByText('anonymous');

  act(() => probe.login({ token: tokenFor({ name: 'Grace Admin', isAdmin: true }) }));
  expect(await screen.findByText('Grace Admin')).toBeInTheDocument();
  expect(localStorage.getItem('admin-token')).toContain('header.');

  act(() => probe.logout());
  expect(screen.getByText('anonymous')).toBeInTheDocument();
  expect(localStorage.getItem('admin-token')).toBeNull();
});

test('clears a token that cannot be decoded during login', async () => {
  renderProvider();
  await screen.findByText('anonymous');

  act(() => probe.login({ token: 'invalid-token' }));

  expect(screen.getByText('anonymous')).toBeInTheDocument();
  expect(localStorage.getItem('admin-token')).toBeNull();
});
