import React from 'react';
import { Link } from 'react-router-dom';
import './AuthForm.css';

const AuthForm = ({ isLogin, formData, setFormData, handleSubmit }) => {
  return (
    <form onSubmit={handleSubmit}>
      {!isLogin && (
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
      )}

      <div className="form-group">
        <label>Email Address</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
      </div>

      {!isLogin && (
        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          />
        </div>
      )}

      {isLogin && (
        <div className="forgot-password">
          <Link to="/reset-password">Forgot Password?</Link>
        </div>
      )}

      <button type="submit" className="submit-btn">
        {isLogin ? 'Login' : 'Sign Up'}
      </button>
    </form>
  );
};

export default AuthForm; 
