import React from 'react';
import './AuthTabs.css';

const AuthTabs = ({ isLogin, setIsLogin }) => {
  return (
    <div className="auth-tabs">
      <button 
        className={isLogin ? 'active' : ''} 
        onClick={() => setIsLogin(true)}
      >
        Login
      </button>
      <button 
        className={!isLogin ? 'active' : ''} 
        onClick={() => setIsLogin(false)}
      >
        Sign Up
      </button>
    </div>
  );
};

export default AuthTabs; 
