/** Recommendation endpoints. */
import { api } from './client';

export const fetchSuggestions = (cityName) =>
  api.get(`/Suggestion/${encodeURIComponent(cityName)}`);
