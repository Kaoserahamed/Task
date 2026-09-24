import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { ToursProvider, useTours } from './ToursContext';
import { useAuth } from './AuthContext';
import * as toursApi from '../api/tours';
import * as bookingsApi from '../api/bookings';

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../api/tours', () => ({
  fetchCompanyTours: jest.fn(),
  fetchTours: jest.fn(),
  deleteTour: jest.fn(),
  updateTourStatus: jest.fn(),
}));
jest.mock('../api/bookings', () => ({ fetchBookingsForTour: jest.fn() }));

let probe;
const Probe = () => {
  probe = useTours();
  return <div>{probe.loading ? 'loading' : `${probe.tours.length} tours`}</div>;
};

const company = { company: { _id: 'company-1' } };
const tour = (id) => ({ _id: id, name: `Tour ${id}` });

const renderProvider = () =>
  render(
    <ToursProvider>
      <Probe />
    </ToursProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  probe = undefined;
  useAuth.mockReturnValue({ company, authLoading: false });
  toursApi.fetchCompanyTours.mockResolvedValue({ success: true, tours: [tour('1'), tour('2')] });
  bookingsApi.fetchBookingsForTour.mockResolvedValue({ success: true, bookings: [{ _id: 'b1' }] });
  toursApi.deleteTour.mockResolvedValue({ success: true });
  toursApi.updateTourStatus.mockResolvedValue({ success: true });
});

test('loads company tours and joins their bookings', async () => {
  renderProvider();

  expect(await screen.findByText('2 tours')).toBeInTheDocument();
  expect(toursApi.fetchCompanyTours).toHaveBeenCalledWith('company-1');
  expect(bookingsApi.fetchBookingsForTour).toHaveBeenCalledWith('1');
  expect(probe.tours[0].bookings).toEqual([{ _id: 'b1' }]);
});

test('keeps tours usable when one booking lookup fails', async () => {
  bookingsApi.fetchBookingsForTour.mockRejectedValueOnce(new Error('booking service down'));
  renderProvider();

  await screen.findByText('2 tours');
  expect(probe.tours[0].bookings).toEqual([]);
  expect(probe.error).toBeNull();
});

test('loads all tours and reports an unsuccessful company response', async () => {
  toursApi.fetchTours.mockResolvedValue({ success: true, tours: [tour('3')] });
  renderProvider();
  await screen.findByText('2 tours');

  await act(async () => {
    await probe.fetchTours();
  });
  expect(screen.getByText('1 tours')).toBeInTheDocument();

  toursApi.fetchCompanyTours.mockResolvedValueOnce({
    success: false,
    error: 'Company unavailable',
  });
  await act(async () => {
    await probe.fetchcompanyTours();
  });
  expect(probe.error).toBe('Company unavailable');
});

test('deletes a tour and updates another tour status', async () => {
  renderProvider();
  await screen.findByText('2 tours');

  await act(async () => {
    await expect(probe.deleteTour('1')).resolves.toEqual({ success: true });
  });
  expect(screen.getByText('1 tours')).toBeInTheDocument();

  await act(async () => {
    await expect(probe.updateTourStatus('2', 'approved')).resolves.toEqual({ success: true });
  });
  expect(toursApi.deleteTour).toHaveBeenCalledWith('1');
  expect(toursApi.updateTourStatus).toHaveBeenCalledWith('2', 'approved');
});

test('returns mutation errors without throwing and rejects missing sessions', async () => {
  useAuth.mockReturnValue({ company: null, authLoading: false });
  toursApi.deleteTour.mockRejectedValueOnce(new Error('delete failed'));
  renderProvider();

  await act(async () => {
    await expect(probe.deleteTour('1')).resolves.toEqual({
      success: false,
      error: 'delete failed',
    });
    await expect(probe.fetchcompanyTours()).resolves.toBeUndefined();
  });
  expect(probe.error).toBe('No company logged in');
});
