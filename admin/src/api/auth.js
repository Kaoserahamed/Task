/** Admin authentication and profile endpoints. */
import { api } from './client';

export const login = (email, password) =>
  api.post('/api/admin/login', { email, password }, { auth: false });

export const signup = (email, password) =>
  api.post('/api/admin/signup', { email, password }, { auth: false });

export const fetchProfile = () => api.get('/api/admin/profile');

export const updateProfile = (profile) => api.post('/api/admin/profile', profile);

export const changePassword = (currentPassword, newPassword) =>
  api.post('/api/admin/change-password', { currentPassword, newPassword });

export const updateNotificationSettings = (settings) =>
  api.post('/api/admin/update-notifications', settings);
