import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './TourMonitoring.css';
import PackageInfo from '../TourDetails/PackageInfo';
import PackageGallery from '../TourDetails/PackageGallery';

const TourMonitoring = () => {
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
    const fetchTours = async () => {
      try {
        const res = await axios.get('https://backend-eight-tan-16.vercel.app/api/tours');
        const fetchedTours = Array.isArray(res.data) ? res.data : res.data.tours;
        setTours(fetchedTours || []);
      } catch (err) {
        console.error('Failed to fetch tours:', err);
        setTours([]); // fallback to empty array
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, []);

  useEffect(() => {
    if (selectedTourId) {
      // Try to find in loaded tours first
      const found = tours.find(t => t._id === selectedTourId);
      if (found) {
        setSelectedTour(found);
        setGalleryActiveImage(0);
      } else {
        // Fetch from API if not found
        setModalLoading(true);
        axios.get(`https://backend-eight-tan-16.vercel.app/api/tours/${selectedTourId}`)
          .then(res => {
            setSelectedTour(res.data.tour || res.data);
            setGalleryActiveImage(0);
          })
          .catch(err => {
            setSelectedTour(null);
          })
          .finally(() => setModalLoading(false));
      }
    } else {
      setSelectedTour(null);
    }
  }, [selectedTourId, tours]);

  useEffect(() => {
    // After fetching tours, fetch revenue for each tour
    async function fetchRevenues() {
      const revenues = {};
      for (const tour of tours) {
        try {
          const res = await axios.get(`https://backend-eight-tan-16.vercel.app/api/bookings/tour/${tour._id}`);
          const bookings = res.data.bookings || [];
          revenues[tour._id] = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0) * 0.1;
        } catch (e) {
          revenues[tour._id] = 0;
        }
      }
      setTourRevenues(revenues);
    }
    if (tours.length > 0) fetchRevenues();
  }, [tours]);

  const handleStatusChange = async (id, newStatus, review) => {
    try {
      await axios.patch(`https://backend-eight-tan-16.vercel.app/api/tours/${id}/status`, { status: newStatus, review: review });
      console.log(review);
      setTours(tours.map((tour) =>
        tour._id === id ? { ...tour, status: newStatus, review: review } : tour
      ));
      setShowReviewModal(false);
      setReviewText('');
      setTourToReject(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleRejectClick = (tour) => {
    setTourToReject(tour);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = () => {
    if (tourToReject && reviewText.trim()) {
      handleStatusChange(tourToReject._id, 'rejected', reviewText);
    }
  };

  const filteredTours = tours.filter((tour) => {
    if (activeTab !== 'all' && tour.status !== activeTab) return false;
    if (
      searchTerm &&
      !tour.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !tour.destinations.some(dest => dest.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <i className="fas fa-check-circle"></i>;
      case 'pending': return <i className="fas fa-hourglass-half"></i>;
      case 'rejected': return <i className="fas fa-times-circle"></i>;
      default: return null;
    }
  };

  // Helper to get company name (simulate, or use tour.company?.name if available)
  const getCompanyName = (tour) => {
    if (!tour) return '';
    if (tour.company && tour.company.name) return tour.company.name;
    if (tour.companyName) return tour.companyName;
    return 'Unknown Company';
  };

  const now = new Date();
  const upcomingTours = tours.filter(t => t.status === 'approved' && new Date(t.startDate) > now);
  const finishedTours = tours.filter(t => t.status === 'approved' && new Date(t.endDate) < now);

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
        {['all', 'approved', 'pending', 'rejected', 'upcoming', 'finished'].map(tab => (
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
        ) : (
          (() => {
            let displayTours = filteredTours;
            if (activeTab === 'upcoming') displayTours = upcomingTours;
            if (activeTab === 'finished') displayTours = finishedTours;
            return displayTours.length > 0 ? (
              displayTours.map((tour) => (
                <React.Fragment key={tour._id}>
                  <div className="tour-card">
                    <div className="tour-header">
                      <h3>{tour.name}</h3>
                      <div className={`tour-status ${getStatusClass(tour.status)}`}>
                        {getStatusIcon(tour.status)}{' '}
                        {tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
                      </div>
                    </div>

                    <div className="tour-details">
                      <div className="detail-item">
                        <i className="fas fa-calendar"></i>
                        <span>
                          {new Date(tour.startDate).toLocaleDateString()} to {new Date(tour.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>
                          {tour.destinations.map((d) => d.name).join(', ')}
                        </span>
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
                          <button
                            className="action-btn approve-btn"
                            onClick={() => handleStatusChange(tour._id, 'approved')}
                          >
                            <i className="fas fa-check"></i> Approve
                          </button>
                          <button
                            className="action-btn reject-btn"
                            onClick={() => handleRejectClick(tour)}
                          >
                            <i className="fas fa-times"></i> Reject
                          </button>
                          <button
                            className="action-btn view-btn"
                            onClick={() => setSelectedTourId(tour._id)}
                          >
                            <i className="fas fa-eye"></i> View Details
                          </button>
                        </>
                      )}

                      {tour.status === 'approved' && (
                        <>
                          <button
                            className="action-btn view-btn"
                            onClick={() => setSelectedTourId(tour._id)}
                          >
                            <i className="fas fa-eye"></i> View Details
                          </button>
                        </>
                      )}

                      {(tour.status === 'rejected' || tour.status === 'draft') && (
                        <>
                          <button
                            className="action-btn pending-btn"
                            onClick={() => handleStatusChange(tour._id, 'approved')}
                          >
                            <i className="fas fa-undo"></i> Approve
                          </button>
                          <button
                            className="action-btn view-btn"
                            onClick={() => setSelectedTourId(tour._id)}
                          >
                            <i className="fas fa-eye"></i> View Details
                          </button>
                        </>
                      )}
                    </div>

                    {activeTab === 'finished' && (
                      <div className="tour-revenue">
                        <i className="fas fa-dollar-sign"></i> Revenue Earned: ${tourRevenues[tour._id]?.toLocaleString() || 0}
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
                  {selectedTourId === tour._id && (
                    <div className="admin-inline-modal-outer">
                      <div className="admin-inline-modal">
                        <button className="admin-modal-close" onClick={() => setSelectedTourId(null)}>&times;</button>
                        {modalLoading || !selectedTour ? (
                          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                        ) : (
                          <div className="admin-modal-flex">
                            <div className="admin-modal-gallery">
                              <PackageGallery
                                images={selectedTour.images || []}
                                activeImage={galleryActiveImage}
                                setActiveImage={setGalleryActiveImage}
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
                </React.Fragment>
              ))
            ) : (
              <div className="no-tours">
                <i className="fas fa-search"></i>
                <p>No tours found matching your criteria</p>
              </div>
            );
          })()
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="admin-inline-modal-outer">
          <div className="admin-inline-modal review-modal">
            <button className="admin-modal-close" onClick={() => {
              setShowReviewModal(false);
              setReviewText('');
              setTourToReject(null);
            }}>&times;</button>
            <h3>Reject Tour</h3>
            <div className="review-form">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows="4"
              />
              <div className="review-actions">
                <button
                  className="action-btn cancel-btn"
                  onClick={() => {
                    setShowReviewModal(false);
                    setReviewText('');
                    setTourToReject(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="action-btn reject-btn"
                  onClick={handleReviewSubmit}
                  disabled={!reviewText.trim()}
                >
                  Submit Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourMonitoring;

