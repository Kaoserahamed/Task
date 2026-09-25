import React from 'react';
import Navbar from '../Components/Navbar/Navbar';
import './AppLayout.css';

const AppLayout = ({ children }) => (
  <div className="app-layout">
    <Navbar />
    <main className="app-layout__main">{children}</main>
  </div>
);

export default AppLayout;
