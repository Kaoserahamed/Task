import React from 'react';
import './TourMonitoring.css';
import { useTourMonitoring } from './useTourMonitoring';
import TourCard from './TourCard';
import ReviewModal from './ReviewModal';

/**
 * Tour monitoring screen.
 *
 * A view over `useTourMonitoring`: the screen owns no fetching, no state and no
 * business rules — the search box, the tabs and the two modals only call the
 * hook. The list row and the rejection modal are their own presentational
 * components so this file stays readable.
 */
const TourMonitoring = () => {
  const {
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
    handleApprove,
    handleRejectClick,
    handleReviewSubmit,
    closeReviewModal,
  } = useTourMonitoring();

  return (
    <div className="tour-monitoring">
      <div className="monitoring-header">
        <h2>Tour Monitoring</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search tours by name or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search search-icon"></i>
        </div>
      </div>

      <div className="monitoring-tabs">
        {['all', 'approved', 'pending', 'rejected', 'upcoming', 'finished'].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="tours-count">
        <p>Showing {filteredTours.length} tours</p>
      </div>

      <div className="tours-list">
        {loading ? (
          <p>Loading tours...</p>
        ) : filteredTours.length > 0 ? (
          filteredTours.map((tour) => (
            <TourCard
              key={tour._id}
              tour={tour}
              activeTab={activeTab}
              revenue={tourRevenues[tour._id]}
              modalOpen={selectedTourId === tour._id}
              selectedTour={selectedTour}
              galleryActiveImage={galleryActiveImage}
              onGalleryImageChange={setGalleryActiveImage}
              modalLoading={modalLoading}
              onApprove={handleApprove}
              onReject={handleRejectClick}
              onView={setSelectedTourId}
              onCloseModal={() => setSelectedTourId(null)}
            />
          ))
        ) : (
          <div className="no-tours">
            <i className="fas fa-search"></i>
            <p>No tours found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          reviewText={reviewText}
          onReviewTextChange={setReviewText}
          onSubmit={handleReviewSubmit}
          onClose={closeReviewModal}
        />
      )}
    </div>
  );
};

export default TourMonitoring;
