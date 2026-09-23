/** Traveller authentication, profile and password endpoints. */
import { api } from './client';

export const login = (credentials) => api.post('/user/auth/login', credentials, { auth: false });

export const register = (details) => api.post('/user/auth/register', details, { auth: false });

export const fetchCurrentUser = () => api.get('/user/auth/me');

export const updateProfile = (data) => api.put('/user/auth/update', data);

/** `formData` carries the `avatar` file plus the owner's email. */
export const uploadAvatar = (formData) => api.post('/user/auth/avatar', formData);

export const requestPasswordReset = (email, resetUrl) =>
  api.post('/user/auth/reset', { email, resetUrl }, { auth: false });

export const resetPassword = (token, password) =>
  api.post('/user/auth/reset-password', { token, password }, { auth: false });
