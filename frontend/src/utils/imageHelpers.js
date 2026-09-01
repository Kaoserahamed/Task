/**
 * Image Helper Functions
 * Handles both Cloudinary URLs and local storage paths
 */

import API_BASE_URL from '../config/api';

/**
 * Get the correct image URL
 * @param {string} imagePath - Image path or URL from database
 * @returns {string} - Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return 'https://via.placeholder.com/800x600?text=No+Image';
  }

  // If image is already a full URL (Cloudinary), use it directly
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a relative path (local storage), prepend API_BASE_URL
  return `${API_BASE_URL}/${imagePath}`;
};

/**
 * Get tour thumbnail image
 * @param {object} tour - Tour object with images array
 * @param {string} fallback - Optional fallback image URL
 * @returns {string} - Image URL
 */
export const getTourImage = (tour, fallback = 'https://via.placeholder.com/300x200?text=No+Image') => {
  if (!tour || !tour.images || tour.images.length === 0) {
    return fallback;
  }

  return getImageUrl(tour.images[0]);
};

/**
 * Handle image load error
 * @param {Event} e - Error event
 * @param {string} fallback - Fallback image URL
 */
export const handleImageError = (e, fallback = 'https://via.placeholder.com/300x200?text=No+Image') => {
  e.target.src = fallback;
};
