/**
 * API Configuration
 * Centralized API configuration for the frontend
 */

// Get API base URL from environment variable or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/user/auth/login',
    REGISTER: '/user/auth/register',
    RESET_PASSWORD: '/user/auth/reset',
    RESET_PASSWORD_CONFIRM: '/user/auth/reset-password',
  },

  // Tours
  TOURS: {
    BASE: '/api/tours',
    APPROVED: '/api/tours/approved',
    BY_ID: (id) => `/api/tours/${id}`,
    INCREMENT_VIEW: (id) => `/api/tours/${id}/increment-view`,
    INCREMENT_BOOKING: (id) => `/api/tours/${id}/increment-booking`,
    BOOK_SEATS: (id) => `/api/tours/${id}/book-seats`,
    SEAT_AVAILABILITY: (id) => `/api/tours/${id}/seat-availability`,
    RELEASE_SEATS: (id) => `/api/tours/${id}/release-seats`,
    FILTER: '/api/tours/filter',
  },

  // Reviews
  REVIEWS: {
    BASE: '/reviews',
    BY_TOUR: (tourId) => `/reviews/tour/${tourId}`,
  },

  // Bookings
  BOOKINGS: {
    BASE: '/api/bookings',
    ADD: '/api/bookings/add',
  },

  // Chat
  CHAT: {
    GET_USER_CHAT: (userId, chatType) => `/api/chat/get-user-chat/${userId}?query=${chatType}`,
  },

  // Hotels & Restaurants
  HOTELS: '/api/hotels',
  RESTAURANTS: '/api/restaurants',

  // Wishlist
  WISHLIST: '/api/wishlist',
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${API_BASE_URL}${path}`;
};

// Export API base URL
export { API_BASE_URL };

export default API_BASE_URL;
