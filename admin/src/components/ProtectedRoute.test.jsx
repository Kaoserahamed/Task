import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
});

test('shows a loading state while the session is being restored', () => {
  useAuth.mockReturnValue({ user: null, loading: true });

  render(
    <MemoryRouter>
      <ProtectedRoute>
        <div>Admin dashboard</div>
      </ProtectedRoute>
    </MemoryRouter>
  );

  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

test('redirects anonymous and non-admin users to login', () => {
  for (const user of [null, { name: 'Traveller' }, { isAdmin: false }]) {
    useAuth.mockReturnValue({ user, loading: false });
    const view = render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<div>Admin login</div>} />
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <div>Admin dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin login')).toBeInTheDocument();
    view.unmount();
  }
});

test('renders the protected dashboard for an admin', () => {
  useAuth.mockReturnValue({ user: { isAdmin: true }, loading: false });

  render(
    <MemoryRouter>
      <ProtectedRoute>
        <div>Admin dashboard</div>
      </ProtectedRoute>
    </MemoryRouter>
  );

  expect(screen.getByText('Admin dashboard')).toBeInTheDocument();
});
