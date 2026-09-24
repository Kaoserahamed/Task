import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginSignup from './LoginSignup';
import * as authApi from '../../api/auth';

jest.mock('../../api/auth', () => ({
  login: jest.fn(),
  register: jest.fn(),
}));

jest.mock('../../Context/AuthContext', () => ({
  useAuth: () => ({ login: jest.fn() }),
}));

test('renders the company login form', () => {
  render(
    <MemoryRouter>
      <LoginSignup />
    </MemoryRouter>
  );
  expect(screen.getByText(/Welcome Back!/i)).toBeInTheDocument();
  expect(screen.getByText(/Fill Demo Credentials/i)).toBeInTheDocument();
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
  authApi.register.mockResolvedValue({ token: 'jwt', company: { name: 'Contoso' } });

  render(
    <MemoryRouter>
      <LoginSignup />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
  fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
    target: { value: 'Contoso Tours' },
  });
  fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
    target: { value: 'ops@contoso.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
    target: { value: 'secret-123' },
  });
  const signUpButtons = screen.getAllByRole('button', { name: 'Sign Up' });
  fireEvent.click(signUpButtons[signUpButtons.length - 1]);

  await waitFor(() =>
    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Contoso Tours',
      email: 'ops@contoso.com',
      password: 'secret-123',
    })
  );
  expect(authApi.login).not.toHaveBeenCalled();
});
