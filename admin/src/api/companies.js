/** Company registry and verification endpoints. */
import { api } from './client';

export const fetchCompanies = () => api.get('/api/companies');

export const fetchCompanyRegistrations = () => api.get('/company/auth/companies');

export const updateCompanyStatus = ({ companyId, verificationStatus, isVerified }) =>
  api.patch('/company/auth/update-status', { companyId, verificationStatus, isVerified });
