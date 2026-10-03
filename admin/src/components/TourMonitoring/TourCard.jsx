import React from 'react';
import PackageInfo from '../TourDetails/PackageInfo';
import PackageGallery from '../TourDetails/PackageGallery';

const getStatusClass = (status) => {
  switch (status) {
    case 'approved':
      return 'status-approved';
    case 'pending':
      return 'status-pending';
    case 'rejected':
      return 'status-rejected';
    default:
      return '';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'approved':
      return <i className="fas fa-check-circle"></i>;
    case 'pending':
      return <i className="fas fa-hourglass-half"></i>;
    case 'rejected':
      return <i className="fas fa-times-circle"></i>;
    default:
      return null;
  }
};

// Helper to get company name (simulate, or use tour.company?.name if available)
const getCompanyName = (tour) => {
  if (!tour) return '';
  if (tour.company && tour.company.name) return tour.company.name;
  if (tour.companyName) return tour.companyName;
  return 'Unknown Company';
};

/**
 * One row of the monitoring list plus the detail modal it opens.
 *
 * Presentational only: every action is a callback from `useTourMonitoring`, so
 * this file holds no fetching, no state and no business rules.
 */
const TourCard = ({
  tour,
  activeTab,
  revenue,
  modalOpen,
  selectedTour,
  galleryActiveImage,
  onGalleryImageChange,
  modalLoading,
  onApprove,
  onReject,
  onView,
  onCloseModal,
}) => (
  <>
    <div className="tour-card">
      <div className="tour-header">
        <h3>{tour.name}</h3>
        <div className={`tour-status ${getStatusClass(tour.status)}`}>
          {getStatusIcon(tour.status)} {tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
        </div>
      </div>

      <div className="tour-details">
        <div className="detail-item">
          <i className="fas fa-calendar"></i>
          <span>
            {new Date(tour.startDate).toLocaleDateString()} to{' '}
            {new Date(tour.endDate).toLocaleDateString()}
          </span>
        </div>
        <div className="detail-item">
          <i className="fas fa-map-marker-alt"></i>
          <span>{tour.destinations.map((d) => d.name).join(', ')}</span>
        </div>
        <div className="detail-item">
          <i className="fas fa-users"></i>
          <span>{tour.maxGroupSize || 0} seats</span>
        </div>
        <div className="detail-item">
          <i className="fas fa-dollar-sign"></i>
          <span>Price: ${tour.price}</span>
        </div>
        <div className="detail-item">
          <i className="fas fa-car"></i>
          <span>{tour.transportation?.type}</span>
        </div>
      </div>

      <div className="tour-actions">
        {tour.status === 'pending' && (
          <>
            <button className="action-btn approve-btn" onClick={() => onApprove(tour._id)}>
              <i className="fas fa-check"></i> Approve
            </button>
            <button className="action-btn reject-btn" onClick={() => onReject(tour)}>
              <i className="fas fa-times"></i> Reject
            </button>
            <button className="action-btn view-btn" onClick={() => onView(tour._id)}>
              <i className="fas fa-eye"></i> View Details
            </button>
          </>
        )}

        {tour.status === 'approved' && (
          <>
            <button className="action-btn view-btn" onClick={() => onView(tour._id)}>
              <i className="fas fa-eye"></i> View Details
            </button>
          </>
        )}

        {(tour.status === 'rejected' || tour.status === 'draft') && (
          <>
            <button className="action-btn pending-btn" onClick={() => onApprove(tour._id)}>
              <i className="fas fa-undo"></i> Approve
            </button>
            <button className="action-btn view-btn" onClick={() => onView(tour._id)}>
              <i className="fas fa-eye"></i> View Details
            </button>
          </>
        )}
      </div>

      {activeTab === 'finished' && (
        <div className="tour-revenue">
          <i className="fas fa-dollar-sign"></i> Revenue Earned: ${revenue?.toLocaleString() || 0}
        </div>
      )}

      {tour.status === 'rejected' && tour.review && (
        <div className="tour-review">
          <i className="fas fa-comment"></i>
          <span>Review: {tour.review}</span>
        </div>
      )}
    </div>

    {/* Inline modal after the selected tour card */}
    {modalOpen && (
      <div className="admin-inline-modal-outer">
        <div className="admin-inline-modal">
          <button className="admin-modal-close" onClick={onCloseModal}>
            &times;
          </button>
          {modalLoading || !selectedTour ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
          ) : (
            <div className="admin-modal-flex">
              <div className="admin-modal-gallery">
                <PackageGallery
                  images={selectedTour.images || []}
                  activeImage={galleryActiveImage}
                  setActiveImage={onGalleryImageChange}
                />
              </div>
              <div className="admin-modal-details">
                {/* Company Name */}
                <div className="admin-company-name">
                  <i className="fas fa-building"></i> {getCompanyName(selectedTour)}
                </div>
                <PackageInfo tour={selectedTour} companyId={selectedTour.companyId} />
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </>
);

export default TourCard;
