/** Company directory lookup used when a traveller starts a chat. */
import { api } from './client';

export const searchCompanies = (query) =>
  api.get(`/company/auth/search?query=${encodeURIComponent(query)}`);
