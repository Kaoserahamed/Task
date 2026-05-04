import React from 'react';
import './Breadcrumb.css'; // Assuming you have a CSS file for styling
const Breadcrumb = ({ step }) => {
  return (
    <div className="breadcrumb">
      <span className="breadcrumb-active">Package Selection</span>
      <span className="breadcrumb-separator">→</span>
      <span className={step >= 1 ? 'breadcrumb-active' : 'breadcrumb-inactive'}>Contact Information</span>
      <span className="breadcrumb-separator">→</span>
      <span className={step >= 2 ? 'breadcrumb-active' : 'breadcrumb-inactive'}>Payment</span>
      <span className="breadcrumb-separator">→</span>
      <span className="breadcrumb-inactive">Confirmation</span>
    </div>
  );
};

export default Breadcrumb;
