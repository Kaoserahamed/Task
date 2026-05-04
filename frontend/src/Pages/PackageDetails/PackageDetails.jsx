import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { ToursContext } from '../../Context/ToursContext';
import PackageGallery from '../../Components/PackageDetails/PackageGallery';
import PackageInfo from '../../Components/PackageDetails/PackageInfo';
import BookingCard from '../../Components/PackageDetails/BookingCard';
import { useAuth } from '../../Context/AuthContext';
import './PackageDetails.css';
import socket from '../../socket'
import TourSuggestions from '../../Components/TourSuggestions/TourSuggestions';
import axios from 'axios';


const PackageDetails = () => {
  const { id } = useParams();
  
  const { tours, loading, error, fetchTourById } = useContext(ToursContext);
  const [isloading, setIsloading] = useState(false);
  const [chats, setChats] = useState([]);
  const [tour, setTour] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [errorReviews, setErrorReviews] = useState(null);
  const [avSeats, setAvSeats] = useState(null);
 const {user}=useAuth();
 const [weatherCity, setWeatherCity] = useState('');
 useEffect(()=>{
   if(user){
    console.log(user);

   }

 },
[user]);
let use,userId;
//const city=tour.weather.city
console.log(tour);
if(user)
{ use=user.user;
console.log(use);
 userId=use._id;
}
console.log(tour)
const chatType='comuse';

const fetchChats = async () => {
  setIsloading(true);
  try {
    const authtoken = localStorage.getItem('token');
    if (!authtoken) {
      throw new Error('No token found');
    }
    
    const response = await fetch(`https://backend-eight-tan-16.vercel.app/api/chat/get-user-chat/${userId}?query=${chatType}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authtoken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }

    const responseData = await response.json();
    setChats(responseData || []);
  } catch (error) {
    console.error('Error fetching chats:', error);
    setChats([]);
  } finally {
    setIsloading(false);
  }
};
useEffect(()=>{
  if(userId)
  fetchChats();
},[userId,chatType]);
useEffect(() => {
  if (userId) {
    console.log('its happening');
    console.log(userId);
    fetchChats();
  }
}, [userId, chatType]);
  const fetchReviews = async (tourId) => {
    try {
      setLoadingReviews(true);
      const response = await axios.get(`https://backend-eight-tan-16.vercel.app/reviews/tour/${tourId}`);
      setReviews(response.data);
      setErrorReviews(null);
    } catch (error) {
      setErrorReviews('Failed to load reviews.');
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Move isTourCompleted function before useEffect
  const isTourCompleted = (startDate) => {
    if (!startDate) return false;
    const now = new Date();
    const tourStartDate = new Date(startDate);
    return tourStartDate < now;
  };
  const getTour = async () => {
    try {
      setLocalLoading(true);
      const data = await fetchTourById(id);
      setTour(data);
      
      setLocalError(null);
      setActiveImage(0);
      
      // Fetch reviews if tour is completed
      if (isTourCompleted(data.startDate)) {
        await fetchReviews(data._id);
      }
    } catch (err) {
      setLocalError('Failed to load tour details.');
    } finally {
      setLocalLoading(false);
    }
  };
  console.log(avSeats);
  useEffect(() => {
    if (id) {
      getTour();
      
    }
  }, [id]);

  useEffect(() => {
    if (tour && tour.weather) {
      setWeatherCity(tour.weather.city);
      
    }
  }, [tour]);
  console.log(weatherCity);
  if (localLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading tour details...</p>
      </div>
    );
  }

  if (localError || !tour) {
    return (
      <div className="error-container">
        <i className="fas fa-exclamation-circle"></i>
        <p>{localError || 'Error loading tour details. Please try again later.'}</p>
      </div>
    );
  }

  const handleImageChange = (index) => {
    setActiveImage(index);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={i} className="fas fa-star"></i>);
    }

    if (hasHalfStar) {
      stars.push(<i key="half" className="fas fa-star-half-alt"></i>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="far fa-star"></i>);
    }

    return stars;
  };
console.log(tour);
  const ReviewsSection = () => (
    <div className="reviews-section">
      <h3>Customer Reviews</h3>
      {loadingReviews ? (
        <div className="loading-reviews">
          <div className="loading-spinner"></div>
          <p>Loading reviews...</p>
        </div>
      ) : errorReviews ? (
        <div className="error-reviews">
          <i className="fas fa-exclamation-circle"></i>
          <p>{errorReviews}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="no-reviews">
          <i className="fas fa-comment-slash"></i>
          <p>No reviews available for this tour yet.</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review, index) => (
            <div key={review._id || index} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {review.userName ? review.userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="reviewer-details">
                    <h4>{review.userName || 'Anonymous User'}</h4>
                    <div className="review-rating">
                      {renderStars(review.rating || 0)}
                      <span className="rating-number">({review.rating || 0}/5)</span>
                    </div>
                  </div>
                </div>
                
              </div>
              {review.comment && (
                <div className="review-comment">
                  <p>{review.comment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  return (
    <div className="package-details-container">
      {/* Gallery Section */}
      <div className="gallery-section">
        <PackageGallery
          images={tour.images}
          activeImage={activeImage}
          setActiveImage={handleImageChange}
        />
      </div>

      {/* Main Content Section */}
      <div className="main-content-section">
        <PackageInfo 
          tour={tour} 
          companyId={tour.companyId} 
          user={use} 
          chatType={chatType} 
          compnayName={tour.compnayName} 
          chats={chats}
          weatherCity={weatherCity}
        />
      </div>

      {/* Conditional Rendering: Booking Card or Reviews */}
      {isTourCompleted(tour.startDate) ? (
        <div className="reviews-container">
          <ReviewsSection />
        </div>
      ) : (
        <div className="booking-section">
          <BookingCard
            price={tour.price}
            availableSeats={tour.availableSeats}
            startDate={tour.startDate}
            endDate={tour.endDate}
            tourId={tour._id}
            socket={socket}
            weatherCity={weatherCity}
          />
        </div>
        
      )}
      <section id="tour-suggestions" className="tour-suggestions">
            <TourSuggestions weatherCity={weatherCity} />
          </section>
    </div>
    
  );
};

export default PackageDetails;
