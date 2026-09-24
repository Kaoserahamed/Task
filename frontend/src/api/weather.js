/** Weather lookup for a destination city. */
import { api } from './client';

export const fetchWeather = (cityName) => api.get(`/api/weather/${encodeURIComponent(cityName)}`);
