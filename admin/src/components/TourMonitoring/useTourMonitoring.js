import { useCallback, useEffect, useMemo, useState } from 'react';
import * as toursApi from '../../api/tours';
import * as bookingsApi from '../../api/bookings';
import { logError } from '../../utils/logger';
import { filterMonitoringTours } from '../../utils/tourMonitoringFilters';

/** Commission the console books on a confirmed booking, as a share of its total. */
const REVENUE_SHARE = 0.1;

/** The API answers either a bare array or `{ tours }`; normalise both. */
const asTourList = (data) => {
  const tours = Array.isArray(data) ? data : data?.tours;
  return tours || [];
};

/**
 * Own the admin tour-monitoring screen's data and interactions.
 *
 * The component had grown a fetch effect, a detail-fetch effect, a revenue
 * effect and three handlers alongside its markup. Moving them here keeps the
 * component a view over this state — the same split as `useDashboardData` and
 * the storefront's `useSearchFilters` — and lets each behaviour (the failed
 * fetch fallback, a per-tour revenue failure, a status change) be tested
 * without rendering the whole screen.
 *
 * Every dependency is injectable so a test can drive the failure paths directly
 * instead of reaching through the HTTP client.
 */
export const useTourMonitoring = ({
  loadTours = toursApi.fetchTours,
  loadTour = toursApi.fetchTour,
  updateTourStatus = toursApi.updateTourStatus,
  loadBookingsForTour = bookingsApi.fetchBookingsForTour,
  now = () => new Date(),
} = {}) => {
  const [tours, setTours] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTourId, setSelectedTourId] = useState(null);
  const [selectedTour, setSelectedTour] = useState(null);
  const [galleryActiveImage, setGalleryActiveImage] = useState(0);
  const [modalLoading, setModalLoading] = useState(false);
  const [tourRevenues, setTourRevenues] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [tourToReject, setTourToReject] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchTours = async () => {
      try {
        const data = await loadTours();
        if (!active) return;
        setTours(asTourList(data));
      } catch (err) {
        if (!active) return;
        logError('Failed to fetch tours:', err);
        setTours([]); // fallback to empty array
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTours();
    return () => {
      active = false;
    };
  }, [loadTours]);

  useEffect(() => {
    if (!selectedTourId) {
      setSelectedTour(null);
      return undefined;
    }

    // Prefer the tour already in memory; only call the API for one we lack.
    const found = tours.find((tour) => tour._id === selectedTourId);
    if (found) {
      setSelectedTour(found);
      setGalleryActiveImage(0);
      return undefined;
    }

    let active = true;
    setModalLoading(true);
    loadTour(selectedTourId)
      .then((data) => {
        if (!active) return;
        setSelectedTour(data.tour || data);
        setGalleryActiveImage(0);
      })
      .catch(() => {
        if (active) setSelectedTour(null);
      })
      .finally(() => {
        if (active) setModalLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadTour, selectedTourId, tours]);

  useEffect(() => {
    if (tours.length === 0) return undefined;

    let active = true;

    const fetchRevenues = async () => {
      const revenues = {};
      for (const tour of tours) {
        try {
          const data = await loadBookingsForTour(tour._id);
          const bookings = data.bookings || [];
          revenues[tour._id] =
            bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0) * REVENUE_SHARE;
        } catch (e) {
          // One unreachable tour must not blank the whole revenue column.
          revenues[tour._id] = 0;
        }
      }
      if (active) setTourRevenues(revenues);
    };

    fetchRevenues();
    return () => {
      active = false;
    };
  }, [loadBookingsForTour, tours]);

  const closeReviewModal = useCallback(() => {
    setShowReviewModal(false);
    setReviewText('');
    setTourToReject(null);
  }, []);

  const handleStatusChange = useCallback(
    async (id, newStatus, review) => {
      try {
        await updateTourStatus(id, { status: newStatus, review });
        // Functional update: the handler no longer closes over a stale `tours`.
        setTours((current) =>
          current.map((tour) => (tour._id === id ? { ...tour, status: newStatus, review } : tour))
        );
        closeReviewModal();
      } catch (error) {
        logError('Error updating status:', error);
      }
    },
    [closeReviewModal, updateTourStatus]
  );

  /** Approving needs no review text, so it is a thin, intent-named wrapper. */
  const handleApprove = useCallback(
    (id) => handleStatusChange(id, 'approved'),
    [handleStatusChange]
  );

  const handleRejectClick = useCallback((tour) => {
    setTourToReject(tour);
    setShowReviewModal(true);
  }, []);

  const handleReviewSubmit = useCallback(() => {
    if (tourToReject && reviewText.trim()) {
      handleStatusChange(tourToReject._id, 'rejected', reviewText);
    }
  }, [handleStatusChange, reviewText, tourToReject]);

  const filteredTours = useMemo(
    () => filterMonitoringTours(tours, { tab: activeTab, searchTerm, now: now() }),
    [activeTab, now, searchTerm, tours]
  );

  return {
    tours,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    loading,
    filteredTours,
    selectedTourId,
    setSelectedTourId,
    selectedTour,
    galleryActiveImage,
    setGalleryActiveImage,
    modalLoading,
    tourRevenues,
    showReviewModal,
    reviewText,
    setReviewText,
    handleStatusChange,
    handleApprove,
    handleRejectClick,
    handleReviewSubmit,
    closeReviewModal,
  };
};

export default useTourMonitoring;
