import React from 'react';

/**
 * The rejection-reason modal, extracted from `TourMonitoring` so the screen
 * keeps only the list. Controlled and stateless: the reason text and the
 * submit/close handlers all come from `useTourMonitoring`.
 */
const ReviewModal = ({ reviewText, onReviewTextChange, onSubmit, onClose }) => (
  <div className="admin-inline-modal-outer">
    <div className="admin-inline-modal review-modal">
      <button className="admin-modal-close" onClick={onClose}>
        &times;
      </button>
      <h3>Reject Tour</h3>
      <div className="review-form">
        <textarea
          value={reviewText}
          onChange={(e) => onReviewTextChange(e.target.value)}
          placeholder="Please provide a reason for rejection..."
          rows="4"
        />
        <div className="review-actions">
          <button className="action-btn cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="action-btn reject-btn"
            onClick={onSubmit}
            disabled={!reviewText.trim()}
          >
            Submit Rejection
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default ReviewModal;
