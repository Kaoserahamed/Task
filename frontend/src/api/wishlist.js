/** Wishlist endpoints; the authenticated token identifies the owner. */
import { api } from './client';

export const fetchWishlist = () => api.get('/api/wishlist');

export const addToWishlist = (tourId) => api.post('/api/wishlist/add', { tourId });

export const removeFromWishlist = (tourId) => api.delete(`/api/wishlist/remove/${tourId}`);
