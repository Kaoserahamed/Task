import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import AuthForm from '../AuthForm/AuthForm';
import AuthTabs from '../AuthTabs/AuthTabs';
import API_BASE_URL from '../../config/api';
import './LoginSignup.css';

const DEMO_COMPANY_EMAIL = process.env.REACT_APP_DEMO_COMPANY_EMAIL || '';
const DEMO_COMPANY_PASSWORD = process.env.REACT_APP_DEMO_COMPANY_PASSWORD || '';

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
    confirmPassword: '',
  });

  // Function to fill demo credentials (just fills the form, doesn't submit)
  // Demo password is injected via REACT_APP_DEMO_COMPANY_PASSWORD env var.
  // Seed the matching account with DEMO_COMPANY_PASSWORD in backend/.env (see backend/.env.example).
  const fillDemoCredentials = () => {
    setFormData({
      email: DEMO_COMPANY_EMAIL,
      password: DEMO_COMPANY_PASSWORD,
      name: formData.name,
      confirmPassword: formData.confirmPassword,
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
          password: formData.password,
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

        {location.state?.message && <div className="login-message">{location.state.message}</div>}

        {error && (
          <div
            className="error-message"
            style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <AuthTabs isLogin={isLogin} setIsLogin={setIsLogin} />

        {isLogin && (
          <div className="demo-credentials">
            <p className="demo-label">🎯 Try Demo Company Account:</p>
            <button type="button" className="demo-btn" onClick={fillDemoCredentials}>
              Fill Demo Credentials
            </button>
            <p className="demo-info">
              Email: <strong>{DEMO_COMPANY_EMAIL || 'set REACT_APP_DEMO_COMPANY_EMAIL'}</strong> |
              Password:{' '}
              <strong>
                {DEMO_COMPANY_PASSWORD ? '••••••••' : 'set REACT_APP_DEMO_COMPANY_PASSWORD'}
              </strong>
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
      </div>
    </div>
  );
};

export default LoginSignup;
