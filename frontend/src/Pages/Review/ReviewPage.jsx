// ReviewPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { ToursContext } from '../../Context/ToursContext'; // Import ToursContext
import { Star, X, Upload, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';
import './ReviewPage.css';

const ReviewPage = () => {
  const { tours, loading } = useContext(ToursContext); // Get tours from context
  const [selectedTour, setSelectedTour] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [userName, setUserName] = useState('');
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTours, setUserTours] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch user's completed tours
  // In a real app, this would come from a user's booking history API
  useEffect(() => {
    if (tours && tours.length > 0) {
      // For demo, assume these are the user's completed tours
      // In a real app, you would filter based on user booking history
      const completedTours = tours.filter(tour =>
        // Simple filtering logic for demo - in reality this would be based on user's actual bookings
        new Date(tour.startDate) < new Date() &&
        new Date(tour.endDate) < new Date()
      );

      setUserTours(completedTours);
    }
  }, [tours]);

  // Fetch reviews when selectedTour changes
  useEffect(() => {
    if (selectedTour) {
      fetchReviewsForTour(selectedTour);
    } else {
      fetchAllReviews();
    }
  }, [selectedTour]);

  const fetchAllReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await axios.get('https://backend-eight-tan-16.vercel.app/reviews');
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Fallback to empty array if API fails
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchReviewsForTour = async (tourId) => {
    try {
      setLoadingReviews(true);
      const response = await axios.get(`https://backend-eight-tan-16.vercel.app/reviews/tour/${tourId}`);
      setReviews(response.data);
    } catch (error) {
      console.error(`Error fetching reviews for tour ${tourId}:`, error);
      // Fallback to empty array if API fails
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleRatingClick = (value) => {
    setRating(value);
    if (errors.rating) {
      setErrors({ ...errors, rating: null });
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newErrors = { ...errors };

    // Validate file types and sizes
    const validFiles = selectedFiles.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isValidType) {
        newErrors.photos = 'Only JPG, JPEG, and PNG formats are allowed.';
        return false;
      }

      if (!isValidSize) {
        newErrors.photos = 'Files must be smaller than 5MB.';
        return false;
      }

      return true;
    });

    // Check if adding these files would exceed the 5 image limit
    if (photos.length + validFiles.length > 5) {
      newErrors.photos = 'You can upload a maximum of 5 images.';
      setErrors(newErrors);
      return;
    }

    if (validFiles.length > 0) {
      const newPhotos = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name
      }));

      setPhotos([...photos, ...newPhotos]);
      newErrors.photos = null;
    }

    setErrors(newErrors);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);

    if (errors.photos && newPhotos.length < 5) {
      setErrors({ ...errors, photos: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedTour) {
      newErrors.tour = 'Please select a tour';
    }

    if (!userName.trim()) {
      newErrors.userName = 'Please enter your name';
    }

    if (!rating || rating === 0) {
      newErrors.rating = 'Please provide a rating';
    }

    if (reviewText.length > 1000) {
      newErrors.reviewText = 'Review text cannot exceed 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Create form data for multipart submission
      const formData = new FormData();
      formData.append('tourId', selectedTour);
      formData.append('userName', userName);
      formData.append('rating', rating);
      formData.append('comment', reviewText);

      // Append each photo file
      photos.forEach(photo => {
        formData.append('photos', photo.file);
      });

      // Submit review to API - use the correct path
      const response = await axios.post('https://backend-eight-tan-16.vercel.app/reviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Add the new review to the local state for immediate display
      const newReview = response.data;
      setReviews(prevReviews => [newReview, ...prevReviews]);

      // Show success message
      setSuccess(true);

      // Reset form after delay
      setTimeout(() => {
        resetForm();
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error submitting review:', error);

      // Provide a more descriptive error message
      const errorMessage = error.response?.data?.message ||
        `Failed to submit review: ${error.message}`;

      setErrors({
        submit: errorMessage
      });

      // For development purposes, if API fails, create a mock review
      if (process.env.NODE_ENV === 'development') {
        const mockReview = {
          _id: Date.now().toString(),
          tourId: selectedTour,
          userName: userName,
          rating: rating,
          comment: reviewText,
          date: new Date().toISOString(),
          photos: photos.map(photo => photo.preview)
        };

        setReviews(prevReviews => [mockReview, ...prevReviews]);
        setSuccess(true);

        setTimeout(() => {
          resetForm();
          setSuccess(false);
        }, 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedTour('');
    setRating(0);
    setReviewText('');
    setUserName('');
    setPhotos([]);
    setErrors({});
  };

  const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};


  const getTourById = (id) => {
    return tours.find(tour => tour._id === id) || {};
  };

  const characterCount = reviewText.length;
  const characterLimit = 1000;
  const isApproachingLimit = characterCount > characterLimit * 0.8;
  const isOverLimit = characterCount > characterLimit;

  if (loading) {
    return <div className="loading-spinner">Loading your tour information...</div>;
  }

  return (
    <div className="review-page">
      <h1>Share Your Tour Experience</h1>

      {success && (
        <div className="success-message">
          <Check size={20} />
          <span>Thank you for your review! Your feedback helps other travelers.</span>
        </div>
      )}

      <div className="review-container">
        <div className="review-form-section">
          <h2>Write a Review</h2>
          <div className="review-form">
            <div className="form-group">
              <label htmlFor="tour-select">Select Tour:</label>
              <select
                id="tour-select"
                value={selectedTour}
                onChange={(e) => setSelectedTour(e.target.value)}
                className={errors.tour ? 'error' : ''}
              >
                <option value="">-- Select a tour --</option>
                {userTours
                  .filter(tour => {
                    if (!tour.endDate) return false;
                    const endDate = new Date(tour.endDate);
                    const today = new Date();
                    endDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    return endDate < today; // Only completed tours
                  })
                  .map(tour => (
                    <option key={tour._id} value={tour._id}>
                      {tour.name} ({formatDate(tour.startDate)} to {formatDate(tour.endDate)})
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
                onChange={(e) => setUserName(e.target.value)}
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
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
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
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience, tips for other travelers, and highlights from the tour..."
                rows={5}
                className={isOverLimit ? 'error' : ''}
              ></textarea>
              <div className={`character-count ${isApproachingLimit ? 'approaching-limit' : ''} ${isOverLimit ? 'over-limit' : ''}`}>
                {characterCount}/{characterLimit} characters
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
                  onChange={handleFileChange}
                  multiple
                  className="file-input"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="upload-button">
                  <Upload size={20} />
                  <span>Upload Photos</span>
                </label>
                <div className="upload-help">
                  Up to 5 images (.jpg, .jpeg, .png, max 5MB each)
                </div>
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
                        onClick={() => removePhoto(index)}
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

            <button
              type="button"
              className="submit-button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>

        <div className="reviews-section">
          <h2>
            {selectedTour
              ? `Reviews for ${getTourById(selectedTour).name || 'Selected Tour'}`
              : 'Recent Reviews'}
          </h2>

          <div className="reviews-list">
            {loadingReviews ? (
              <div className="loading-reviews">Loading reviews...</div>
            ) : reviews.length > 0 ? (
              reviews.map(review => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-name">{review.userName}</div>
                      <div className="review-date">{formatDate(review.date)}</div>
                    </div>
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={i < review.rating ? '#FFD700' : 'none'}
                          stroke={i < review.rating ? '#FFD700' : '#666'}
                        />
                      ))}
                    </div>
                  </div>

                  {review.comment && (
                    <div className="review-comment">{review.comment}</div>
                  )}


                  {review.photos && review.photos.length > 0 && (
                    <div className="review-photos">
                      {review.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo.startsWith('http') ? photo : `https://backend-eight-tan-16.vercel.app${photo}`}
                          alt="Review"
                        />
                      ))}
                    </div>
                  )}

                  <div className="review-tour">
                    <small>Tour: {getTourById(review.tourId)?.name || 'Unknown Tour'}</small>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-reviews">
                <AlertCircle size={20} />
                <span>
                  {selectedTour
                    ? "No reviews available for this tour yet. Be the first to share your experience!"
                    : "No reviews available yet. Share your experience after completing a tour!"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
