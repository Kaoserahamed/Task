import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { useAuth } from '../../context/AuthContext';
import * as authApi from '../../api/auth';

jest.mock('../../api/auth', () => ({
  login: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const fillAndSubmit = (email, password) => {
  render(<Login />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Login' }));
};

test('submits credentials to the api layer and hands the session to the context', async () => {
  const contextLogin = jest.fn();
  useAuth.mockReturnValue({ login: contextLogin });
  authApi.login.mockResolvedValue({ token: 'admin-jwt', user: { email: 'admin@example.com' } });

  fillAndSubmit('admin@example.com', 'secret-123');

  await waitFor(() =>
    expect(authApi.login).toHaveBeenCalledWith('admin@example.com', 'secret-123')
  );
  expect(contextLogin).toHaveBeenCalledWith({
    token: 'admin-jwt',
    user: { email: 'admin@example.com' },
  });
});

test('surfaces the api error message when the credentials are rejected', async () => {
  const contextLogin = jest.fn();
  useAuth.mockReturnValue({ login: contextLogin });
  authApi.login.mockRejectedValue(Object.assign(new Error('Invalid credentials'), { status: 401 }));

  fillAndSubmit('admin@example.com', 'wrong');

  expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  expect(contextLogin).not.toHaveBeenCalled();
});
