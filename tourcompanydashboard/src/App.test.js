import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./Context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({ company: null, login: jest.fn(), logout: jest.fn() }),
}));

jest.mock('./Context/ToursContext', () => ({
  ToursProvider: ({ children }) => <div>{children}</div>,
  useTours: () => ({ tours: [], loading: false }),
}));

test('renders company login when logged out', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Welcome Back!/i)).toBeInTheDocument();
  expect(screen.getByText(/Try Demo Company Account/i)).toBeInTheDocument();
});


