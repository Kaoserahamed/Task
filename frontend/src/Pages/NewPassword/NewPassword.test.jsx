import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import NewPassword from './NewPassword';
import * as authApi from '../../api/auth';

jest.mock('../../api/auth', () => ({ resetPassword: jest.fn() }));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/reset-password/token-1']}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/reset-password/:token" element={<NewPassword />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  authApi.resetPassword.mockResolvedValue({ success: true });
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test('rejects mismatched and short passwords before calling the API', () => {
  renderPage();

  fireEvent.change(screen.getByPlaceholderText('Enter new password'), {
    target: { value: 'short' },
  });
  fireEvent.change(screen.getByPlaceholderText('Confirm new password'), {
    target: { value: 'different' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Set New Password' }));
  expect(screen.getByText('Passwords do not match')).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText('Confirm new password'), {
    target: { value: 'short' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Set New Password' }));
  expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
  expect(authApi.resetPassword).not.toHaveBeenCalled();
});

test('resets a valid password and returns the user to login', async () => {
  renderPage();
  fireEvent.change(screen.getByPlaceholderText('Enter new password'), {
    target: { value: 'secret123' },
  });
  fireEvent.change(screen.getByPlaceholderText('Confirm new password'), {
    target: { value: 'secret123' },
  });
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  await user.click(screen.getByRole('button', { name: 'Set New Password' }));

  expect(authApi.resetPassword).toHaveBeenCalledWith('token-1', 'secret123');
  expect(await screen.findByText('Password has been reset successfully')).toBeInTheDocument();
  act(() => {
    jest.advanceTimersByTime(2000);
  });
  expect(await screen.findByText('Login page')).toBeInTheDocument();
});

test('shows an API error when password reset fails', async () => {
  authApi.resetPassword.mockRejectedValueOnce(new Error('Reset link expired'));
  renderPage();
  fireEvent.change(screen.getByPlaceholderText('Enter new password'), {
    target: { value: 'secret123' },
  });
  fireEvent.change(screen.getByPlaceholderText('Confirm new password'), {
    target: { value: 'secret123' },
  });
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  await user.click(screen.getByRole('button', { name: 'Set New Password' }));

  expect(await screen.findByText('Reset link expired')).toBeInTheDocument();
});
