import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Companies from './Companies';
import * as companiesApi from '../../api/companies';

const mockNavigate = jest.fn();

jest.mock('../../api/companies', () => ({
  fetchCompanies: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const company = (overrides = {}) => ({
  _id: 'company-1',
  name: 'Contoso Tours',
  licenseNumber: 'LIC-9',
  email: 'ops@contoso.com',
  phone: '+94 11 000 0000',
  address: 'Colombo',
  verificationStatus: 'Verified',
  ownerName: 'Ada Lovelace',
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  companiesApi.fetchCompanies.mockResolvedValue({ success: true, companies: [company()] });
});

test('renders the registered companies', async () => {
  render(<Companies />);

  expect(await screen.findByText('Contoso Tours')).toBeInTheDocument();
  expect(screen.getByText(/ops@contoso.com/)).toBeInTheDocument();
  expect(screen.getByText('Verified')).toBeInTheDocument();
});

test('sends a pending company to the registration review screen', async () => {
  companiesApi.fetchCompanies.mockResolvedValue({
    success: true,
    companies: [company({ verificationStatus: 'Pending' })],
  });

  render(<Companies />);

  fireEvent.click(await screen.findByRole('button', { name: /View Details/i }));

  expect(mockNavigate).toHaveBeenCalledWith('/admin/registration-request/company-1');
  expect(screen.queryByText(/Company Details/)).not.toBeInTheDocument();
});

test('opens and closes the details modal for a verified company', async () => {
  render(<Companies />);

  fireEvent.click(await screen.findByRole('button', { name: /View Details/i }));

  expect(await screen.findByText('Owner Information')).toBeInTheDocument();
  expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole('button', { name: 'Close company details' }));

  await waitFor(() => expect(screen.queryByText('Owner Information')).not.toBeInTheDocument());
});

test('shows the reason the registry could not be read', async () => {
  companiesApi.fetchCompanies.mockRejectedValue(new Error('Registry unavailable'));

  render(<Companies />);

  expect(await screen.findByText('Registry unavailable')).toBeInTheDocument();
});
