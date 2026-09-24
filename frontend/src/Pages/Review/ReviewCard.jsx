import { Star } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import { formatReviewDate } from './reviewUtils';

// One review in the list: reviewer, rating, comment, photos and tour name.
const ReviewCard = ({ review, tourName }) => (
  <div className="review-card">
    <div className="review-header">
      <div className="reviewer-info">
        <div className="reviewer-name">{review.userName}</div>
        <div className="review-date">{formatReviewDate(review.date)}</div>
      </div>
      <div className="review-rating">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            size={16}
            fill={index < review.rating ? '#FFD700' : 'none'}
            stroke={index < review.rating ? '#FFD700' : '#666'}
          />
        ))}
      </div>
    </div>

    {review.comment && <div className="review-comment">{review.comment}</div>}

    {review.photos && review.photos.length > 0 && (
      <div className="review-photos">
        {review.photos.map((photo, index) => (
          <img
            key={index}
            src={photo.startsWith('http') ? photo : `${API_BASE_URL}${photo}`}
            alt="Review"
          />
        ))}
      </div>
    )}

    <div className="review-tour">
      <small>Tour: {tourName || 'Unknown Tour'}</small>
    </div>
  </div>
);

export default ReviewCard;
