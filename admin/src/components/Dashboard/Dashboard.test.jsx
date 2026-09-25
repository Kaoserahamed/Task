import { fireEvent, render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { useDashboardData } from '../../hooks/useDashboardData';

jest.mock('../../hooks/useDashboardData', () => ({
  useDashboardData: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('announces that the dashboard is loading', () => {
  useDashboardData.mockReturnValue({ loading: true });

  render(<Dashboard />);

  expect(screen.getByRole('status')).toHaveTextContent('Loading admin dashboard...');
});

test('shows the failure reason and lets the operator retry', () => {
  const retry = jest.fn();
  useDashboardData.mockReturnValue({ loading: false, error: 'Registry unavailable', retry });
  render(<Dashboard />);

  expect(screen.getByRole('alert')).toHaveTextContent('Registry unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalledTimes(1);
});
