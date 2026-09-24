import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginSignup from './LoginSignup';
import * as authApi from '../../api/auth';

jest.mock('../../api/auth', () => ({
  login: jest.fn(),
  register: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: {} }),
}));

jest.mock('../../Context/AuthContext', () => ({
  useAuth: () => ({ login: jest.fn() }),
}));

test('renders login form with demo credentials button', () => {
  render(
    <MemoryRouter>
      <LoginSignup />
    </MemoryRouter>
  );
  expect(screen.getByText(/Welcome Back!/i)).toBeInTheDocument();
  expect(screen.getByText(/Fill Demo Credentials/i)).toBeInTheDocument();
  expect(screen.getByText(/Try Demo Account/i)).toBeInTheDocument();
});

test('switches to register mode and collects name plus password confirmation', () => {
  render(
    <MemoryRouter>
      <LoginSignup />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

  expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
});

test('submits registration details to the api layer', async () => {
  authApi.register.mockResolvedValue({ token: 'jwt', user: { email: 'ada@example.com' } });

  render(
    <MemoryRouter>
      <LoginSignup />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
  fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
    target: { value: 'Ada Lovelace' },
  });
  fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
    target: { value: 'ada@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
    target: { value: 'secret-123' },
  });
  const signUpButtons = screen.getAllByRole('button', { name: 'Sign Up' });
  fireEvent.click(signUpButtons[signUpButtons.length - 1]);

  await waitFor(() =>
    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secret-123',
    })
  );
  expect(authApi.login).not.toHaveBeenCalled();
});
