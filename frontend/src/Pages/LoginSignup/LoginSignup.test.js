import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginSignup from './Pages/LoginSignup/LoginSignup';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: {} }),
}));

jest.mock('./Context/AuthContext', () => ({
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
