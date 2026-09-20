import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({ isAuthenticated: false, login: jest.fn(), logout: jest.fn() }),
}));

test('renders admin login page', () => {
  render(<App />);
  expect(screen.getByText(/Admin Login/i)).toBeInTheDocument();
  expect(screen.getByText(/Try Demo Admin Account/i)).toBeInTheDocument();
});

