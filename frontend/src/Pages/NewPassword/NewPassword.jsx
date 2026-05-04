import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './NewPassword.css';

const NewPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token } = useParams();

    // Verify token when component mounts
   

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    console.log('Submit');
    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      const response = await fetch('https://backend-eight-tan-16.vercel.app/user/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password
        }),
      });

      const data = await response.json();
      console.log(data);
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setMessage('Password has been reset successfully');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setError(error.message);
    }
  };
 console.log(message);

  
  return (
    <div className="new-password-page">
      <div className="new-password-container">
        <h2>Set New Password</h2>
        <p className="new-password-instructions">
          Please enter your new password below.
        </p>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
              minLength="6"
            />
          </div>
          <button type="submit" className="submit-btn">
            Set New Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPassword; 
