import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  // Function to refresh user data from server
  const refreshUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const data = await authApi.fetchCurrentUser();

      if (data.success) {
        const updatedUserData = { ...user, user: data.user };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        setUser(updatedUserData);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      // If the token is rejected, drop the session.
      if (error.status === 401) {
        logout();
      }
    }
  };

  // Load fresh user data on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      refreshUserData();
    }
  }, []); // Only run once on mount

  const login = async (userData) => {
    try {
      setLoading(true);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userData.token);
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updatedData) => {
    try {
      setLoading(true);

      // Make API call to update user data
      const updatedUser = await authApi.updateProfile(updatedData);

      // Update local storage and state
      const newUserData = { ...user, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUserData));
      setUser(newUserData);

      return updatedUser;
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function to update user data locally (for avatar updates)
  const updateUserLocal = (updatedUserData) => {
    const newUserData = {
      ...user,
      user: { ...user.user, ...updatedUserData },
    };
    localStorage.setItem('user', JSON.stringify(newUserData));
    setUser(newUserData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    updateUserLocal,
    refreshUserData,
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
