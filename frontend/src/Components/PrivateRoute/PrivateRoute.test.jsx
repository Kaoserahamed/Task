import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { useAuth } from '../../Context/AuthContext';

jest.mock('../../Context/AuthContext', () => ({ useAuth: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
});

test('redirects anonymous visitors to login', () => {
  useAuth.mockReturnValue({ user: null });

  render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route
          path="/private"
          element={
            <PrivateRoute>
              <div>Private content</div>
            </PrivateRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText('Login page')).toBeInTheDocument();
  expect(screen.queryByText('Private content')).not.toBeInTheDocument();
});

test('renders protected content for an authenticated user', () => {
  useAuth.mockReturnValue({ user: { token: 'jwt' } });

  render(
    <MemoryRouter>
      <PrivateRoute>
        <div>Private content</div>
      </PrivateRoute>
    </MemoryRouter>
  );

  expect(screen.getByText('Private content')).toBeInTheDocument();
});
