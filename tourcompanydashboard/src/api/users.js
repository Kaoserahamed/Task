/** User lookup used when a company starts a chat. */
import { api } from './client';

export const searchUsers = (query) =>
  api.get(`/user/auth/search?query=${encodeURIComponent(query)}`);
