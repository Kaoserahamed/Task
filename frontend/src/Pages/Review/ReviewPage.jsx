// ReviewPage.jsx
import { useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { ToursContext } from '../../Context/ToursContext';
import * as reviewsApi from '../../api/reviews';
import { logError } from '../../utils/logger';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';
import {
  buildReviewFormData,
  filterCompletedTours,
  findTourById,
  validateReviewForm,
  validateReviewPhotos,
} from './reviewUtils';
import './ReviewPage.css';

/**
 * Review page: owns the request lifecycle and form state, and composes the
 * presentational `ReviewForm` / `ReviewCard` children. The date formatting,
 * completed-tour filter, validation and multipart assembly are pure functions
 * in `reviewUtils.js`.
 */
const ReviewPage = () => {
  const { tours, loading } = useContext(ToursContext);
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

  // Fetch user's completed tours. In a real app this would come from a user's
  // booking history API.
  useEffect(() => {
    if (tours && tours.length > 0) {
      setUserTours(filterCompletedTours(tours));
    }
  }, [tours]);

  useEffect(() => {
    if (selectedTour) {
      fetchReviewsForTour(selectedTour);
    } else {
      fetchAllReviews();
    }
    // The loaders above only depend on the selected tour id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTour]);

  const fetchAllReviews = async () => {
    try {
      setLoadingReviews(true);
      const data = await reviewsApi.fetchReviews();
      setReviews(data);
    } catch (error) {
      logError('Error fetching reviews:', error);
      // Fallback to empty array if API fails
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchReviewsForTour = async (tourId) => {
    try {
      setLoadingReviews(true);
      const data = await reviewsApi.fetchTourReviews(tourId);
      setReviews(data);
    } catch (error) {
      logError(`Error fetching reviews for tour ${tourId}:`, error);
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

  const handleFileChange = (event) => {
    const { accepted, error, limitExceeded } = validateReviewPhotos(
      event.target.files,
      photos.length
    );

    if (limitExceeded) {
      setErrors((current) => ({ ...current, photos: error }));
      return;
    }

    if (accepted.length > 0) {
      setPhotos((current) => [
        ...current,
        ...accepted.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          name: file.name,
        })),
      ]);
    }

    setErrors((current) => ({ ...current, photos: error }));

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

  const resetForm = () => {
    setSelectedTour('');
    setRating(0);
    setReviewText('');
    setUserName('');
    setPhotos([]);
    setErrors({});
  };

  const validateForm = () => {
    const nextErrors = validateReviewForm({ selectedTour, userName, rating, reviewText });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Submit review to API
      const newReview = await reviewsApi.createReview(
        buildReviewFormData({ tourId: selectedTour, userName, rating, reviewText, photos })
      );

      // Add the new review to the local state for immediate display
      setReviews((prevReviews) => [newReview, ...prevReviews]);

      // Show success message
      setSuccess(true);

      // Reset form after delay
      setTimeout(() => {
        resetForm();
        setSuccess(false);
      }, 3000);
    } catch (error) {
      logError('Error submitting review:', error);

      // Provide a more descriptive error message
      const errorMessage =
        error.response?.data?.message || `Failed to submit review: ${error.message}`;

      setErrors({
        submit: errorMessage,
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
          photos: photos.map((photo) => photo.preview),
        };

        setReviews((prevReviews) => [mockReview, ...prevReviews]);
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
        <ReviewForm
          userTours={userTours}
          selectedTour={selectedTour}
          onTourChange={setSelectedTour}
          userName={userName}
          onUserNameChange={setUserName}
          rating={rating}
          hoverRating={hoverRating}
          onRatingHover={setHoverRating}
          onRatingClick={handleRatingClick}
          reviewText={reviewText}
          onReviewTextChange={setReviewText}
          photos={photos}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
          onRemovePhoto={removePhoto}
          errors={errors}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />

        <div className="reviews-section">
          <h2>
            {selectedTour
              ? `Reviews for ${findTourById(tours, selectedTour).name || 'Selected Tour'}`
              : 'Recent Reviews'}
          </h2>

          <div className="reviews-list">
            {loadingReviews ? (
              <div className="loading-reviews">Loading reviews...</div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard
                  key={review._id}
                  review={review}
                  tourName={findTourById(tours, review.tourId).name}
                />
              ))
            ) : (
              <div className="no-reviews">
                <AlertCircle size={20} />
                <span>
                  {selectedTour
                    ? 'No reviews available for this tour yet. Be the first to share your experience!'
                    : 'No reviews available yet. Share your experience after completing a tour!'}
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
