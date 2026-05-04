import React from 'react';
import './ResetPasswordForm.css';


const ResetPasswordForm = ({ formData, setFormData, handleSubmit }) => {
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Email Address</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>

      <button type="submit" className="submit-btn">
        Reset Password
      </button>
    </form>
  );
};

export default ResetPasswordForm; 
