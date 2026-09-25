import React from 'react';
import Navbar from '../Components/Navbar/Navbar';
import './CompanyLayout.css';

const CompanyLayout = ({ children }) => (
  <div className="company-shell">
    <Navbar />
    <main className="content">{children}</main>
  </div>
);

export default CompanyLayout;
