import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as bookingsApi from '../api/bookings';
import * as companiesApi from '../api/companies';
import * as toursApi from '../api/tours';
import socket from '../socket';
import { logError } from '../utils/logger';
import { buildAdminDashboardMetrics } from '../utils/dashboardMetrics';

const asArray = (value) => (Array.isArray(value) ? value : []);
const verificationStatus = (company) => String(company?.verificationStatus || '').toLowerCase();

/** Own the admin dashboard's data, calculations, refresh, and socket lifecycle. */
export const useDashboardData = ({
  loadTours = toursApi.fetchTours,
  loadBookings = bookingsApi.fetchAllBookings,
  loadCompanies = companiesApi.fetchCompanyRegistrations,
  socketClient = socket,
  now = () => new Date(),
} = {}) => {
  const [resources, setResources] = useState({ tours: [], bookings: [], companies: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tourResponse, bookingResponse, companyResponse] = await Promise.all([
        loadTours(),
        loadBookings(),
        loadCompanies(),
      ]);
      if (!mounted.current) return;
      setResources({
        tours: asArray(tourResponse?.tours),
        bookings: asArray(bookingResponse?.bookings),
        companies: asArray(companyResponse?.companies),
      });
    } catch (requestError) {
      if (!mounted.current) return;
      setError(requestError?.message || 'The dashboard data could not be loaded.');
      logError('Failed to load admin dashboard data:', requestError);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [loadBookings, loadCompanies, loadTours]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!socketClient?.on) return undefined;

    const handleVerification = (event) => {
      if (event?.action === 'pen') return refresh();
      return undefined;
    };
    const handleTourApproval = (data) => {
      if (!data?.tourId) return;
      setResources((current) => {
        if (current.tours.some((tour) => tour._id === data.tourId)) return current;
        return {
          ...current,
          tours: [
            ...current.tours,
            {
              _id: data.tourId,
              name: data.tourName,
              companyName: data.companyName,
              companyId: data.companyId,
              status: 'pending',
              price: data.price,
              timestamp: data.timestamp,
            },
          ],
        };
      });
    };

    socketClient.on('verif', handleVerification);
    socketClient.on('tour_approval_request', handleTourApproval);
    return () => {
      socketClient.off?.('verif', handleVerification);
      socketClient.off?.('tour_approval_request', handleTourApproval);
    };
  }, [refresh, socketClient]);

  const metrics = useMemo(
    () =>
      buildAdminDashboardMetrics(resources.tours, resources.bookings, resources.companies, now()),
    [now, resources]
  );

  return {
    ...metrics,
    loading,
    error,
    retry: refresh,
    pendingCompanies: resources.companies.filter(
      (company) => verificationStatus(company) === 'pending'
    ),
    approvedCompanies: resources.companies.filter(
      (company) => verificationStatus(company) === 'approved'
    ),
    pendingPackages: resources.tours.filter((tour) => tour?.status === 'pending'),
  };
};

export default useDashboardData;
