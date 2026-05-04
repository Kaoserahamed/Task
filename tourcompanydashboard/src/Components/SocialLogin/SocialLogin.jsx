import React from 'react';
import './SocialLogin.css';

const SocialLogin = () => {
  return (
    <div className="social-login">
      <p>Or continue with</p>
      <div className="social-buttons">
        <button type="button" className="google-btn">
          <i className="fab fa-google"></i> Google
        </button>
        <button type="button" className="facebook-btn">
          <i className="fab fa-facebook-f"></i> Facebook
        </button>
      </div>
    </div>
  );
};

export default SocialLogin; 
