import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import AuthForm from '../../Components/AuthForm/AuthForm';
import AuthTabs from '../../Components/AuthTabs/AuthTabs';
import './LoginSignup.css';
import * as authApi from '../../api/auth';
import { logError } from '../../utils/logger';

const DEMO_USER_EMAIL = process.env.REACT_APP_DEMO_USER_EMAIL || '';
const DEMO_USER_PASSWORD = process.env.REACT_APP_DEMO_USER_PASSWORD || '';

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
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
  // Demo password is injected via REACT_APP_DEMO_USER_PASSWORD env var.
  // Seed the matching account with DEMO_USER_PASSWORD in backend/.env (see backend/.env.example).
  const fillDemoCredentials = () => {
    setFormData({
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD,
      name: formData.name,
      confirmPassword: formData.confirmPassword,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const credentials = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };
      const data = isLogin ? await authApi.login(credentials) : await authApi.register(credentials);

      // Pass the complete data object to login
      await login(data);

      // Redirect to intended page or home
      if (location.state?.from) {
        navigate(location.state.from);
      } else {
        navigate('/');
      }
    } catch (error) {
      logError('Authentication error:', error);
      // Here you should show an error message to the user
      // You can add a state variable for error messages
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

        <AuthTabs isLogin={isLogin} setIsLogin={setIsLogin} />

        {isLogin && (
          <div className="demo-credentials">
            <p className="demo-label">🎯 Try Demo Account:</p>
            <button type="button" className="demo-btn" onClick={fillDemoCredentials}>
              Fill Demo Credentials
            </button>
            <p className="demo-info">
              Email: <strong>{DEMO_USER_EMAIL || 'set REACT_APP_DEMO_USER_EMAIL'}</strong> |
              Password:{' '}
              <strong>
                {DEMO_USER_PASSWORD ? '••••••••' : 'set REACT_APP_DEMO_USER_PASSWORD'}
              </strong>
            </p>
          </div>
        )}

        <AuthForm
          isLogin={isLogin}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default LoginSignup;
