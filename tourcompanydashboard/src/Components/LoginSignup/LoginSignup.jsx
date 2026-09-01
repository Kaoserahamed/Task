import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import AuthForm from '../AuthForm/AuthForm';
import AuthTabs from '../AuthTabs/AuthTabs';
import SocialLogin from '../SocialLogin/SocialLogin';
import API_BASE_URL from '../../config/api';
import './LoginSignup.css';

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  // Function to fill demo credentials
  const fillDemoCredentials = () => {
    setFormData({
      ...formData,
      email: 'demo@adventuretours.com',
      password: 'demo123'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/company/auth/login' : '/company/auth/register';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Pass the complete data object to login
      await login(data);
      
      // Redirect to intended page or home
      if (location.state?.from) {
        navigate(location.state.from);
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
          <p>{isLogin ? 'Login to access your account' : 'Sign up to get started'}</p>
        </div>

        {location.state?.message && (
          <div className="login-message">
            {location.state.message}
          </div>
        )}

        {error && (
          <div className="error-message" style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <AuthTabs isLogin={isLogin} setIsLogin={setIsLogin} />
        
        {isLogin && (
          <div className="demo-credentials">
            <p className="demo-label">🎯 Try Demo Company Account:</p>
            <button 
              type="button" 
              className="demo-btn"
              onClick={fillDemoCredentials}
            >
              Fill Demo Credentials
            </button>
            <p className="demo-info">
              Email: <strong>demo@adventuretours.com</strong> | Password: <strong>demo123</strong>
            </p>
          </div>
        )}
        
        <AuthForm 
          isLogin={isLogin}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          loading={loading}
        />

        <SocialLogin />
      </div>
    </div>
  );
};

export default LoginSignup; 
