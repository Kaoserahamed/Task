import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import * as authApi from '../api/auth';

jest.mock('../api/auth', () => ({ updateCompanyInfo: jest.fn() }));

let probe;
const Probe = () => {
  probe = useAuth();
  return (
    <div>
      {probe.loading ? 'loading' : probe.company ? probe.company.company.name : 'anonymous'}
    </div>
  );
};

const company = (overrides = {}) => ({
  token: 'company-token',
  company: { _id: 'company-1', name: 'Atlas Tours', ...overrides },
});

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  probe = undefined;
  authApi.updateCompanyInfo.mockResolvedValue({ company: { name: 'Atlas Adventures' } });
});

test('restores a persisted company session', () => {
  localStorage.setItem('company', JSON.stringify(company()));

  renderProvider();

  expect(screen.getByText('Atlas Tours')).toBeInTheDocument();
  expect(probe.company.company._id).toBe('company-1');
});

test('logs in, persists both session values, and logs out', async () => {
  renderProvider();
  await act(async () => {
    await probe.login(company());
  });

  expect(screen.getByText('Atlas Tours')).toBeInTheDocument();
  expect(localStorage.getItem('company-token')).toBe('company-token');
  expect(JSON.parse(localStorage.getItem('company')).company.name).toBe('Atlas Tours');

  act(() => probe.logout());
  expect(screen.getByText('anonymous')).toBeInTheDocument();
  expect(localStorage.getItem('company')).toBeNull();
  expect(localStorage.getItem('company-token')).toBeNull();
});

test('updates the company profile and persists the merged result', async () => {
  localStorage.setItem('company', JSON.stringify(company()));
  renderProvider();

  await act(async () => {
    await expect(probe.updateCompany({ description: 'Small group tours' })).resolves.toEqual({
      company: { name: 'Atlas Adventures' },
    });
  });

  expect(authApi.updateCompanyInfo).toHaveBeenCalledWith({ description: 'Small group tours' });
  expect(probe.company.company).toMatchObject({ name: 'Atlas Adventures', _id: 'company-1' });
  expect(JSON.parse(localStorage.getItem('company')).company.name).toBe('Atlas Adventures');
});

test('rethrows profile update failures and clears loading state', async () => {
  localStorage.setItem('company', JSON.stringify(company()));
  authApi.updateCompanyInfo.mockRejectedValueOnce(new Error('Update rejected'));
  renderProvider();

  await act(async () => {
    await expect(probe.updateCompany({ name: 'Rejected' })).rejects.toThrow('Update rejected');
  });

  expect(screen.getByText('Atlas Tours')).toBeInTheDocument();
  expect(probe.loading).toBe(false);
});
