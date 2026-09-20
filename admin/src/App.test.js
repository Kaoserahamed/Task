import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({ isAuthenticated: false, login: jest.fn(), logout: jest.fn() }),
}));

test('renders admin login page', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Admin Login/i)).toBeInTheDocument();
  expect(screen.getByText(/Try Demo Admin Account/i)).toBeInTheDocument();
});


