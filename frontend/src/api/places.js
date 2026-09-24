/** Hotel and restaurant listings. */
import { api } from './client';

export const fetchHotels = () => api.get('/api/hotels');

export const fetchRestaurants = () => api.get('/api/restaurants');
