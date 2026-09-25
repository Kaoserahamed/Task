import { render, screen, waitFor } from '@testing-library/react';
import { act, useContext } from 'react';
import { ToursContext, ToursProvider } from './ToursContext';
import * as toursApi from '../api/tours';

jest.mock('../api/tours', () => ({
  fetchApprovedTours: jest.fn(),
  fetchTour: jest.fn(),
}));

let probe;
const Probe = () => {
  probe = useContext(ToursContext);
  return <div>{probe.loading ? 'loading' : `${probe.tours.length} tours`}</div>;
};

const renderProvider = () =>
  render(
    <ToursProvider>
      <Probe />
    </ToursProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  probe = undefined;
  toursApi.fetchApprovedTours.mockResolvedValue({ success: true, tours: [{ _id: 'tour-1' }] });
  toursApi.fetchTour.mockResolvedValue({ success: true, tour: { _id: 'tour-1', name: 'Kandy' } });
});

test('loads approved tours on mount and exposes loading state', async () => {
  renderProvider();

  expect(screen.getByText('loading')).toBeInTheDocument();
  expect(await screen.findByText('1 tours')).toBeInTheDocument();
  expect(toursApi.fetchApprovedTours).toHaveBeenCalledTimes(1);
  expect(probe.error).toBeNull();
});

test('stores an API error and can retry successfully', async () => {
  toursApi.fetchApprovedTours
    .mockRejectedValueOnce(new Error('tour service unavailable'))
    .mockResolvedValueOnce({ success: true, tours: [{ _id: 'tour-2' }] });
  renderProvider();

  await waitFor(() => expect(probe.error).toBe('tour service unavailable'));
  expect(screen.getByText('0 tours')).toBeInTheDocument();

  await act(async () => {
    await probe.fetchTours();
  });

  expect(await screen.findByText('1 tours')).toBeInTheDocument();
  expect(probe.error).toBe('tour service unavailable');
  expect(toursApi.fetchApprovedTours).toHaveBeenCalledTimes(2);
});

test('fetches one tour and rethrows unsuccessful or failed lookups', async () => {
  renderProvider();
  await screen.findByText('1 tours');

  await expect(probe.fetchTourById('tour-1')).resolves.toMatchObject({ name: 'Kandy' });

  toursApi.fetchTour.mockResolvedValueOnce({ success: false, error: 'Tour unavailable' });
  await expect(probe.fetchTourById('missing')).rejects.toThrow('Tour unavailable');

  toursApi.fetchTour.mockRejectedValueOnce(new Error('network down'));
  await expect(probe.fetchTourById('missing')).rejects.toThrow('network down');
});
