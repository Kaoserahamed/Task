import { act, renderHook, waitFor } from '@testing-library/react';
import { logError } from '../../utils/logger';
import { useTourMonitoring } from './useTourMonitoring';

jest.mock('../../utils/logger', () => ({
  logDebug: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn(),
}));

const TOURS = [
  {
    _id: 'tour-1',
    name: 'Alpine Loop',
    status: 'pending',
    startDate: '2026-08-01',
    endDate: '2026-08-05',
    price: 1200,
    maxGroupSize: 12,
    destinations: [{ name: 'Chamonix' }],
    transportation: { type: 'coach' },
  },
  {
    _id: 'tour-2',
    name: 'Desert Nights',
    status: 'approved',
    startDate: '2026-09-10',
    endDate: '2026-09-14',
    price: 800,
    maxGroupSize: 8,
    destinations: [{ name: 'Wadi Rum' }],
    transportation: { type: '4x4' },
  },
];

const createDependencies = (overrides = {}) => ({
  loadTours: jest.fn().mockResolvedValue(TOURS),
  loadTour: jest.fn().mockResolvedValue({}),
  updateTourStatus: jest.fn().mockResolvedValue(undefined),
  loadBookingsForTour: jest.fn().mockResolvedValue({ bookings: [] }),
  now: () => new Date('2026-07-15T12:00:00.000Z'),
  ...overrides,
});

const renderMonitoring = (dependencies) => renderHook(() => useTourMonitoring(dependencies));

describe('useTourMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads the tours it is given', async () => {
    const dependencies = createDependencies();
    const { result } = renderMonitoring(dependencies);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(dependencies.loadTours).toHaveBeenCalledTimes(1);
    expect(result.current.tours).toHaveLength(2);
    expect(result.current.filteredTours).toHaveLength(2);
  });

  test('falls back to an empty list and stops loading when the fetch fails', async () => {
    const dependencies = createDependencies({
      loadTours: jest.fn().mockRejectedValue(new Error('registry unavailable')),
    });
    const { result } = renderMonitoring(dependencies);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tours).toEqual([]);
    expect(result.current.filteredTours).toEqual([]);
    expect(logError).toHaveBeenCalledWith('Failed to fetch tours:', expect.any(Error));
  });

  test('books commission on every tour from the bookings each one returns', async () => {
    const dependencies = createDependencies({
      loadBookingsForTour: jest
        .fn()
        .mockResolvedValueOnce({ bookings: [{ totalAmount: 1000 }, { totalAmount: 500 }] })
        .mockResolvedValueOnce({ bookings: [{ totalAmount: 200 }] }),
    });
    const { result } = renderMonitoring(dependencies);

    await waitFor(() =>
      expect(result.current.tourRevenues).toEqual({ 'tour-1': 150, 'tour-2': 20 })
    );
  });

  test('records zero revenue for one tour without blanking the others', async () => {
    const dependencies = createDependencies({
      loadBookingsForTour: jest
        .fn()
        .mockRejectedValueOnce(new Error('bookings unavailable'))
        .mockResolvedValueOnce({ bookings: [{ totalAmount: 300 }] }),
    });
    const { result } = renderMonitoring(dependencies);

    await waitFor(() => expect(result.current.tourRevenues).toEqual({ 'tour-1': 0, 'tour-2': 30 }));
  });

  test('narrows the list with the search term', async () => {
    const dependencies = createDependencies();
    const { result } = renderMonitoring(dependencies);

    await waitFor(() => expect(result.current.filteredTours).toHaveLength(2));

    act(() => result.current.setSearchTerm('desert'));

    expect(result.current.filteredTours.map((tour) => tour._id)).toEqual(['tour-2']);
  });

  test('approves a tour in place and closes the modal', async () => {
    const dependencies = createDependencies();
    const { result } = renderMonitoring(dependencies);

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => result.current.handleApprove('tour-1'));

    expect(dependencies.updateTourStatus).toHaveBeenCalledWith('tour-1', {
      status: 'approved',
      review: undefined,
    });
    expect(result.current.tours[0]).toMatchObject({ _id: 'tour-1', status: 'approved' });
    expect(result.current.tours[1].status).toBe('approved');
    expect(result.current.showReviewModal).toBe(false);
    expect(result.current.reviewText).toBe('');
  });

  test('submits a rejection with the typed reason', async () => {
    const dependencies = createDependencies();
    const { result } = renderMonitoring(dependencies);

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.handleRejectClick(TOURS[0]));
    expect(result.current.showReviewModal).toBe(true);

    act(() => result.current.setReviewText('Missing itinerary'));
    await act(async () => result.current.handleReviewSubmit());

    expect(dependencies.updateTourStatus).toHaveBeenCalledWith('tour-1', {
      status: 'rejected',
      review: 'Missing itinerary',
    });
    expect(result.current.tours[0]).toMatchObject({
      status: 'rejected',
      review: 'Missing itinerary',
    });
    expect(result.current.showReviewModal).toBe(false);
  });

  test('a blank rejection reason submits nothing', async () => {
    const dependencies = createDependencies();
    const { result } = renderMonitoring(dependencies);

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.handleRejectClick(TOURS[0]));
    act(() => result.current.setReviewText('   '));
    await act(async () => result.current.handleReviewSubmit());

    expect(dependencies.updateTourStatus).not.toHaveBeenCalled();
    expect(result.current.showReviewModal).toBe(true);
  });

  test('keeps the list and the modal when the status change fails', async () => {
    const dependencies = createDependencies({
      updateTourStatus: jest.fn().mockRejectedValue(new Error('write rejected')),
    });
    const { result } = renderMonitoring(dependencies);

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.handleRejectClick(TOURS[0]));
    act(() => result.current.setReviewText('Missing itinerary'));
    await act(async () => result.current.handleReviewSubmit());

    expect(result.current.tours[0].status).toBe('pending');
    expect(result.current.showReviewModal).toBe(true);
    expect(result.current.reviewText).toBe('Missing itinerary');
    expect(logError).toHaveBeenCalledWith('Error updating status:', expect.any(Error));
  });

  test('resolves a tour it already holds without a second request', async () => {
    const dependencies = createDependencies();
    const { result } = renderMonitoring(dependencies);

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSelectedTourId('tour-1'));

    await waitFor(() => expect(result.current.selectedTour).toMatchObject({ _id: 'tour-1' }));
    expect(dependencies.loadTour).not.toHaveBeenCalled();
  });

  test('fetches a tour it does not hold and clears the detail when that fails', async () => {
    const dependencies = createDependencies({
      loadTour: jest.fn().mockRejectedValue(new Error('not found')),
    });
    const { result } = renderMonitoring(dependencies);

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSelectedTourId('tour-404'));

    await waitFor(() => expect(result.current.modalLoading).toBe(false));

    expect(dependencies.loadTour).toHaveBeenCalledWith('tour-404');
    expect(result.current.selectedTour).toBeNull();
  });
});
