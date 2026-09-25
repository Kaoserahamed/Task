import { AlertCircle, Star, Upload, X } from 'lucide-react';
import { REVIEW_CHARACTER_LIMIT, filterCompletedTours, formatReviewDate } from './reviewUtils';

/**
 * Presentational review form. Every field is controlled by the page, so the
 * request lifecycle (submit, success, reset) stays in `ReviewPage.jsx`.
 */
const ReviewForm = ({
  userTours,
  selectedTour,
  onTourChange,
  userName,
  onUserNameChange,
  rating,
  hoverRating,
  onRatingHover,
  onRatingClick,
  reviewText,
  onReviewTextChange,
  photos,
  fileInputRef,
  onFileChange,
  onRemovePhoto,
  errors,
  isSubmitting,
  onSubmit,
}) => {
  const characterCount = reviewText.length;
  const isApproachingLimit = characterCount > REVIEW_CHARACTER_LIMIT * 0.8;
  const isOverLimit = characterCount > REVIEW_CHARACTER_LIMIT;

  return (
    <div className="review-form-section">
      <h2>Write a Review</h2>
      <div className="review-form">
        <div className="form-group">
          <label htmlFor="tour-select">Select Tour:</label>
          <select
            id="tour-select"
            value={selectedTour}
            onChange={(event) => onTourChange(event.target.value)}
            className={errors.tour ? 'error' : ''}
          >
            <option value="">-- Select a tour --</option>
            {filterCompletedTours(userTours).map((tour) => (
              <option key={tour._id} value={tour._id}>
                {tour.name} ({formatReviewDate(tour.startDate)} to {formatReviewDate(tour.endDate)})
              </option>
            ))}
          </select>

          {errors.tour && <div className="error-message">{errors.tour}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="userName">Your Name:</label>
          <input
            type="text"
            id="userName"
            value={userName}
            onChange={(event) => onUserNameChange(event.target.value)}
            placeholder="Enter your name"
            className={errors.userName ? 'error' : ''}
          />
          {errors.userName && <div className="error-message">{errors.userName}</div>}
        </div>

        <div className="form-group">
          <label>Your Rating:</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={28}
                onClick={() => onRatingClick(star)}
                onMouseEnter={() => onRatingHover(star)}
                onMouseLeave={() => onRatingHover(0)}
                fill={(hoverRating || rating) >= star ? '#FFD700' : 'none'}
                stroke={(hoverRating || rating) >= star ? '#FFD700' : '#666'}
                className="star-icon"
              />
            ))}
          </div>
          {errors.rating && <div className="error-message">{errors.rating}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="review-text">Your Review: (Optional)</label>
          <textarea
            id="review-text"
            value={reviewText}
            onChange={(event) => onReviewTextChange(event.target.value)}
            placeholder="Share your experience, tips for other travelers, and highlights from the tour..."
            rows={5}
            className={isOverLimit ? 'error' : ''}
          ></textarea>
          <div
            className={`character-count ${isApproachingLimit ? 'approaching-limit' : ''} ${isOverLimit ? 'over-limit' : ''}`}
          >
            {characterCount}/{REVIEW_CHARACTER_LIMIT} characters
          </div>
          {errors.reviewText && <div className="error-message">{errors.reviewText}</div>}
        </div>

        <div className="form-group photo-upload-section">
          <label>Share Your Photos: (Optional)</label>
          <div className="upload-container">
            <input
              type="file"
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png"
              onChange={onFileChange}
              multiple
              className="file-input"
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className="upload-button">
              <Upload size={20} />
              <span>Upload Photos</span>
            </label>
            <div className="upload-help">Up to 5 images (.jpg, .jpeg, .png, max 5MB each)</div>
          </div>
          {errors.photos && <div className="error-message">{errors.photos}</div>}

          {photos.length > 0 && (
            <div className="photo-previews">
              {photos.map((photo, index) => (
                <div key={index} className="photo-preview">
                  <img src={photo.preview} alt="Preview" />
                  <button
                    type="button"
                    className="remove-photo"
                    onClick={() => onRemovePhoto(index)}
                  >
                    <X size={16} />
                  </button>
                  <div className="photo-name">{photo.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {errors.submit && (
          <div className="form-error">
            <AlertCircle size={20} />
            <span>{errors.submit}</span>
          </div>
        )}

        <button type="button" className="submit-button" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
};

export default ReviewForm;
