import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ManageTours from './ManageTours';

const mockNavigate = jest.fn();
const mockDeleteTour = jest.fn();
const mockUpdateTourStatus = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../socket', () => ({
  __esModule: true,
  // ManageTours subscribes on mount and emits the approval event, so both halves
  // of the socket surface have to exist for the component to render.
  default: { connected: false, on: jest.fn(), off: jest.fn(), emit: jest.fn() },
}));

jest.mock('../../Context/AuthContext', () => ({
  useAuth: () => ({ company: { company: { _id: 'company-1', name: 'Contoso Tours' } } }),
}));

jest.mock('../../Context/ToursContext', () => ({ useTours: () => mockUseTours() }));

const TOURS = [
  {
    _id: 'tour-1',
    name: 'Hill Weekend',
    packageCategories: ['Nature & Eco'],
    tourType: { single: false, group: true },
    startDate: '2026-07-01',
    endDate: '2026-07-02',
    price: '450',
    availableSeats: 10,
    maxGroupSize: 12,
    status: 'approved',
  },
  {
    _id: 'tour-2',
    name: 'Tea Trail',
    packageCategories: ['Cultural'],
    tourType: { single: true, group: false },
    startDate: '2026-08-01',
    endDate: '2026-08-02',
    price: '300',
    status: 'pending',
  },
  {
    // A legacy row whose name never migrated: the confirmation must still read
    // sensibly rather than rendering `undefined`.
    _id: 'tour-3',
    packageCategories: ['Seasonal'],
    tourType: { single: true, group: false },
    startDate: '2026-09-01',
    endDate: '2026-09-02',
    price: '200',
    status: 'draft',
  },
];

function mockUseTours(overrides = {}) {
  return {
    tours: TOURS,
    loading: false,
    error: null,
    deleteTour: mockDeleteTour,
    updateTourStatus: mockUpdateTourStatus,
    fetchcompanyTours: jest.fn(),
    ...overrides,
  };
}

const deleteButtonFor = (name) => screen.getByRole('button', { name: `Delete ${name}` });
const dialog = () => screen.getByRole('alertdialog');

beforeEach(() => {
  mockDeleteTour.mockResolvedValue({ success: true });
  mockUpdateTourStatus.mockResolvedValue({ success: true });
});

test('deleting a tour asks for confirmation instead of calling the API immediately', () => {
  render(<ManageTours />);

  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

  fireEvent.click(deleteButtonFor('Hill Weekend'));

  expect(dialog()).toBeInTheDocument();
  expect(dialog()).toHaveAccessibleDescription(expect.stringContaining('Hill Weekend'));
  // The request is the *confirmation's* consequence, not the button press.
  expect(mockDeleteTour).not.toHaveBeenCalled();
});

test('cancelling closes the dialog without deleting anything', () => {
  render(<ManageTours />);

  fireEvent.click(deleteButtonFor('Hill Weekend'));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(mockDeleteTour).not.toHaveBeenCalled();
});

test('Escape cancels the confirmation', () => {
  render(<ManageTours />);

  fireEvent.click(deleteButtonFor('Tea Trail'));
  fireEvent.keyDown(document, { key: 'Escape' });

  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(mockDeleteTour).not.toHaveBeenCalled();
});

test('confirming deletes the named tour and closes the dialog', async () => {
  render(<ManageTours />);

  fireEvent.click(deleteButtonFor('Tea Trail'));
  fireEvent.click(screen.getByRole('button', { name: 'Delete package' }));

  await waitFor(() => expect(mockDeleteTour).toHaveBeenCalledWith('tour-2'));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
});

test('a failed delete keeps the dialog open and reports the API error', async () => {
  mockDeleteTour.mockResolvedValue({ success: false, error: 'Tour is booked by 3 travellers' });
  render(<ManageTours />);

  fireEvent.click(deleteButtonFor('Hill Weekend'));
  fireEvent.click(screen.getByRole('button', { name: 'Delete package' }));

  await waitFor(() =>
    expect(dialog()).toHaveAccessibleDescription(
      expect.stringContaining('Tour is booked by 3 travellers')
    )
  );
  // Still open, so the operator can read why it failed and retry or cancel.
  expect(mockDeleteTour).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

test('a rejected request is reported rather than thrown at the operator', async () => {
  mockDeleteTour.mockResolvedValue({ success: false, error: '' });
  render(<ManageTours />);

  fireEvent.click(deleteButtonFor('Hill Weekend'));
  fireEvent.click(screen.getByRole('button', { name: 'Delete package' }));

  await waitFor(() =>
    expect(dialog()).toHaveAccessibleDescription(expect.stringContaining('Failed to delete tour'))
  );
});

test('the dialog is disabled while the delete is in flight', async () => {
  let release;
  mockDeleteTour.mockReturnValue(
    new Promise((resolve) => {
      release = () => resolve({ success: true });
    })
  );
  render(<ManageTours />);

  fireEvent.click(deleteButtonFor('Hill Weekend'));
  fireEvent.click(screen.getByRole('button', { name: 'Delete package' }));

  await waitFor(() => expect(dialog()).toHaveAttribute('aria-busy', 'true'));
  expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();

  release();
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
});

test('a rejected status update is reported inline instead of through alert()', async () => {
  mockUpdateTourStatus.mockResolvedValue({ success: false, error: 'Tour is under review' });
  render(<ManageTours />);

  fireEvent.click(screen.getByRole('button', { name: 'Send for Approval' }));

  const notice = await screen.findByRole('alert');
  expect(notice).toHaveTextContent('Tour is under review');

  fireEvent.click(within(notice).getByRole('button', { name: 'Dismiss message' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('a thrown status update still reports inline', async () => {
  mockUpdateTourStatus.mockRejectedValue(new Error('Network request failed.'));
  render(<ManageTours />);

  fireEvent.click(screen.getByRole('button', { name: 'Send for Approval' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Failed to update tour status.');
});

test('a tour with no name still produces a usable confirmation', () => {
  render(<ManageTours />);

  fireEvent.click(deleteButtonFor('this tour package'));

  expect(dialog()).toBeInTheDocument();
  expect(mockDeleteTour).not.toHaveBeenCalled();
});
