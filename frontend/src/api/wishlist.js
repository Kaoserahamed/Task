/** Wishlist endpoints; the API keys the list by the traveller's email. */
import { api } from './client';

export const fetchWishlist = (email) => api.get(`/api/wishlist?email=${encodeURIComponent(email)}`);

export const addToWishlist = (tourId, email) => api.post('/api/wishlist/add', { tourId, email });

export const removeFromWishlist = (tourId, email) =>
  api.delete(`/api/wishlist/remove/${tourId}`, { body: { email } });
