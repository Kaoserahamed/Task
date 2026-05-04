import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PackageDetailsAndApprove.css';
import socket from '../../socket';

const PackageDetailsAndApprove = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTour() {
      const res = await fetch(`https://backend-eight-tan-16.vercel.app/api/tours/${id}`);
      const data = await res.json();
      if (data.success) setTour(data.tour);
      setLoading(false);
    }
    fetchTour();
  }, [id]);

  const handleApprove = async () => {
    await fetch(`https://backend-eight-tan-16.vercel.app/api/tours/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });
    // Emit socket event
    socket.emit('tour_status_update', {
      tourId: id,
      status: 'approved',
      companyId: tour.companyId,
      tourName: tour.name,
      timestamp: new Date()
    });
    console.log("Emited from admin, approved")
    navigate('/');
  };

  const handleReject = async () => {
    const review = window.prompt('Enter a reason for rejection (optional):', '');
    await fetch(`https://backend-eight-tan-16.vercel.app/api/tours/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected', review })
    });
    // Emit socket event
    socket.emit('tour_status_update', {
      tourId: id,
      status: 'rejected',
      review,
      companyId: tour.companyId,
      tourName: tour.name,
      timestamp: new Date()
    });
      console.log("Emited from admin, rejected")
    navigate('/');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!tour) return <div className="error">Tour not found</div>;

  return (
    <div className="package-details-approve upload-tour">
      <div className="edit-tour-header">
        <h1>Package Details</h1>
        <button className="back-button" onClick={() => navigate(-1)}>Back</button>
      </div>
      <div className="form-section">
        <h2>Basic Information</h2>
        <div className="readonly-row"><strong>Name:</strong> {tour.name}</div>
        <div className="readonly-row">
          <strong>Categories:</strong> {tour.packageCategories?.join(', ') || '-'}
          {tour.customCategory && `, ${tour.customCategory}`}
        </div>
        <div className="readonly-row">
          <strong>Tour Type:</strong> 
          {tour.tourType?.single && ' Single'}
          {tour.tourType?.group && ' Group'}
        </div>
        <div className="readonly-row">
          <strong>Duration:</strong> {tour.duration?.days || '-'} days, {tour.duration?.nights || '-'} nights
        </div>
        {tour.tourType?.group && (
          <>
            <div className="readonly-row"><strong>Max Group Size:</strong> {tour.maxGroupSize}</div>
            <div className="readonly-row"><strong>Available Seats:</strong> {tour.availableSeats}</div>
            <div className="readonly-row"><strong>Start Date:</strong> {tour.startDate ? new Date(tour.startDate).toLocaleDateString() : '-'}</div>
            <div className="readonly-row"><strong>End Date:</strong> {tour.endDate ? new Date(tour.endDate).toLocaleDateString() : '-'}</div>
          </>
        )}
      </div>

      <div className="form-section">
        <h2>Services & Amenities</h2>
        <div className="readonly-row">
          <strong>Meals Included:</strong>
          {tour.meals
            ? Object.entries(tour.meals)
                .filter(([k, v]) => v)
                .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
                .join(', ') || '-'
            : '-'}
        </div>
        <div className="readonly-row">
          <strong>Transportation:</strong> {tour.transportation?.type || '-'} {tour.transportation?.details && `(${tour.transportation.details})`}
        </div>
        <div className="readonly-row">
          <strong>Tour Guide:</strong> {tour.tourGuide ? 'Yes' : 'No'}
        </div>
      </div>

      <div className="form-section">
        <h2>Destinations</h2>
        {tour.destinations && tour.destinations.length > 0 ? (
          tour.destinations.map((dest, idx) => (
            <div key={idx} className="readonly-destination">
              <div><strong>Name:</strong> {dest.name}</div>
              <div><strong>Description:</strong> {dest.description}</div>
              <div><strong>Stay Duration:</strong> {dest.stayDuration}</div>
            </div>
          ))
        ) : (
          <div className="readonly-row">-</div>
        )}
      </div>

      <div className="form-section">
        <h2>Package Details</h2>
        <div className="readonly-row">
          <strong>Includes:</strong>
          <ul>
            {tour.includes && tour.includes.length > 0
              ? tour.includes.map((item, idx) => <li key={idx}>{item}</li>)
              : <li>-</li>}
          </ul>
        </div>
        <div className="readonly-row">
          <strong>Excludes:</strong>
          <ul>
            {tour.excludes && tour.excludes.length > 0
              ? tour.excludes.map((item, idx) => <li key={idx}>{item}</li>)
              : <li>-</li>}
          </ul>
        </div>
        <div className="readonly-row">
          <strong>Special Notes:</strong> {tour.specialNote || '-'}
        </div>
        <div className="readonly-row">
          <strong>Cancellation Policy:</strong> {tour.cancellationPolicy || '-'}
        </div>
        <div className="readonly-row">
          <strong>Price:</strong> {tour.price ? `$${tour.price}` : '-'}
        </div>
      </div>

      <div className="form-section">
        <h2>Images</h2>
        <div className="existing-images-grid">
          {tour.images && tour.images.length > 0 ? (
            tour.images.map((img, idx) => (
              <div key={idx} className="existing-image-item">
                <img
                  src={`https://backend-eight-tan-16.vercel.app/${img}`}
                  alt={`tour-img-${idx}`}
                />
              </div>
            ))
          ) : (
            <span className="empty-value">No images</span>
          )}
        </div>
      </div>

      <div className="actions" style={{marginTop: 32}}>
        <button className="approve-btn" onClick={handleApprove}>Approve</button>
        <button className="reject-btn" onClick={handleReject}>Reject</button>
      </div>
    </div>
  );
};

export default PackageDetailsAndApprove;
