import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResetPasswordForm from '../../Components/ResetPasswordForm/ResetPasswordForm';
import './ResetPassword.css';
import * as authApi from '../../api/auth';

const ResetPassword = () => {
  const [formData, setFormData] = useState({ email: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get the current URL when component mounts
    setCurrentUrl(window.location.href);
    console.log('Current URL:', window.location.href);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const data = await authApi.requestPasswordReset(formData.email, currentUrl);

      setMessage(data.message || 'Password reset instructions have been sent to your email');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <h2>Reset Password</h2>
        <p className="reset-instructions">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        <div className="current-url">
          <p>Current URL: {currentUrl}</p>
        </div>
        <ResetPasswordForm
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default ResetPassword;
