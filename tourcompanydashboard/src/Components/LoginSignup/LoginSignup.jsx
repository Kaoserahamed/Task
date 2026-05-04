import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import AuthForm from '../AuthForm/AuthForm';
import AuthTabs from '../AuthTabs/AuthTabs';
import SocialLogin from '../SocialLogin/SocialLogin';
import './LoginSignup.css';

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const endpoint = isLogin ? '/company/auth/login' : '/company/auth/register';
      const response = await fetch(`https://backend-eight-tan-16.vercel.app${endpoint}`, {
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
      // console.log(data.company-token) 
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

        {location.state?.message && (
          <div className="login-message">
            {location.state.message}
          </div>
        )}

        <AuthTabs isLogin={isLogin} setIsLogin={setIsLogin} />
        
        <AuthForm 
          isLogin={isLogin}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
        />

        <SocialLogin />
      </div>
    </div>
  );
};

export default LoginSignup; 
