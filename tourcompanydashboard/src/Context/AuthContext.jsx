import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [company, setCompany] = useState(() => {
    const savedCompany = localStorage.getItem('company');
    return savedCompany ? JSON.parse(savedCompany) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (companyData) => {
    try {
      setLoading(true);
      localStorage.setItem('company', JSON.stringify(companyData));
      localStorage.setItem('company-token', companyData.token);
      setCompany(companyData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (updatedData) => {
    try {
      setLoading(true);

      const updatedUser = await authApi.updateCompanyInfo(updatedData);
      // Merge updated company info into local state
      const newUserData = { ...company, company: { ...company.company, ...updatedUser.company } };
      localStorage.setItem('company', JSON.stringify(newUserData));
      setCompany(newUserData);
      return updatedUser;
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('company');
    localStorage.removeItem('company-token');
    setCompany(null);
  };

  const value = {
    company,
    loading,
    login,
    logout,
    updateCompany,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
