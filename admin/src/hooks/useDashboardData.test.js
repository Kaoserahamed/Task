import { act, renderHook, waitFor } from '@testing-library/react';
import { useDashboardData } from './useDashboardData';

const createHarness = () => {
  const listeners = new Map();
  const socketClient = {
    on: jest.fn((event, listener) => listeners.set(event, listener)),
    off: jest.fn((event) => listeners.delete(event)),
  };
  const dependencies = {
    loadTours: jest.fn().mockResolvedValue({ tours: [{ _id: 'tour-1', status: 'pending' }] }),
    loadBookings: jest
      .fn()
      .mockResolvedValue({ bookings: [{ tourId: 'tour-1', totalAmount: 100 }] }),
    loadCompanies: jest
      .fn()
      .mockResolvedValue({ companies: [{ _id: 'company-1', verificationStatus: 'pending' }] }),
    socketClient,
    now: () => new Date('2026-07-15T12:00:00Z'),
  };
  return { dependencies, listeners, socketClient };
};

test('loads every dashboard resource once and derives the view model', async () => {
  const { dependencies } = createHarness();
  const { result } = renderHook(() => useDashboardData(dependencies));

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(dependencies.loadTours).toHaveBeenCalledTimes(1);
  expect(dependencies.loadBookings).toHaveBeenCalledTimes(1);
  expect(dependencies.loadCompanies).toHaveBeenCalledTimes(1);
  expect(result.current).toMatchObject({
    totalBookings: 1,
    totalRevenue: 10,
    pendingPackages: [{ _id: 'tour-1', status: 'pending' }],
    pendingCompanies: [{ _id: 'company-1', verificationStatus: 'pending' }],
  });
});

test('exposes a failed load and retries all resources without duplicate listeners', async () => {
  const { dependencies, socketClient } = createHarness();
  dependencies.loadTours.mockRejectedValueOnce(new Error('Registry unavailable'));
  const { result, unmount } = renderHook(() => useDashboardData(dependencies));

  await waitFor(() => expect(result.current.error).toBe('Registry unavailable'));
  expect(result.current.loading).toBe(false);

  await act(async () => result.current.retry());
  await waitFor(() => expect(result.current.error).toBe(''));
  expect(dependencies.loadTours).toHaveBeenCalledTimes(2);
  expect(dependencies.loadBookings).toHaveBeenCalledTimes(2);
  expect(dependencies.loadCompanies).toHaveBeenCalledTimes(2);
  expect(socketClient.on).toHaveBeenCalledTimes(2);

  unmount();
  expect(socketClient.off).toHaveBeenCalledWith('verif', expect.any(Function));
  expect(socketClient.off).toHaveBeenCalledWith('tour_approval_request', expect.any(Function));
});

test('adds approval socket events once and refreshes company verification events', async () => {
  const { dependencies, listeners } = createHarness();
  const { result } = renderHook(() => useDashboardData(dependencies));
  await waitFor(() => expect(result.current.loading).toBe(false));

  act(() =>
    listeners.get('tour_approval_request')({
      tourId: 'tour-2',
      tourName: 'New package',
      companyName: 'Alpha',
    })
  );
  expect(result.current.pendingPackages).toContainEqual(
    expect.objectContaining({ _id: 'tour-2', status: 'pending' })
  );

  await act(async () => listeners.get('verif')({ action: 'pen' }));
  expect(dependencies.loadCompanies).toHaveBeenCalledTimes(2);
});
