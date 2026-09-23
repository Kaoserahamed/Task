/** Company authentication, registration and profile endpoints. */
import { api } from './client';

export const login = (credentials) => api.post('/company/auth/login', credentials, { auth: false });

export const register = (details) => api.post('/company/auth/register', details, { auth: false });

export const fetchCompanyRegistrations = () => api.get('/company/auth/companies');

export const fetchCompanyById = (id) => api.get(`/api/company/${id}`);

export const updateCompanyInfo = (data) => api.patch('/company/auth/update-info', data);

export const verifyPassword = (password) => api.post('/company/auth/verify-password', { password });

export const requestPasswordReset = (email, resetUrl) =>
  api.post('/company/auth/reset', { email, resetUrl }, { auth: false });

export const resetPassword = (token, password) =>
  api.post('/company/auth/reset-password', { token, password }, { auth: false });
