import React from 'react';
import Navbar from '../components/Navbar/Navbar';
import './AdminLayout.css';

const AdminLayout = ({ children }) => (
  <div className="admin-shell">
    <Navbar />
    <main className="main-content">{children}</main>
  </div>
);

export default AdminLayout;
