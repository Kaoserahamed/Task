import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {logout} = useAuth();
  const handleLogOut = ()=>{
    logout();
    navigate('/Login')
  }
  return (
    <nav className="navbar">
      <div className="logo-container">
        <h1 className="logo">Admin Panel</h1>
      </div>
      
      <ul className="nav-links">
        <li>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            <i className="fas fa-chart-line"></i>
            <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link to="/tour-monitoring" className={location.pathname === '/tour-monitoring' ? 'active' : ''}>
            <i className="fas fa-check-circle"></i>
            <span>Tour Monitoring</span>
          </Link>
        </li>
        <li>
          <Link to="/admin/companies" className={location.pathname === '/admin/companies' ? 'active' : ''}>
            <i className="fas fa-check-circle"></i>
            <span>Companies</span>
          </Link>
        </li>
        <li>
          <Link to="/admin-support" className={location.pathname === '/admin-support' ? 'active' : ''}>
            <i className="fas fa-headset"></i>
            <span>Admin Support</span>
          </Link>
        </li>
        
        <li>
          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </Link>
        </li>
     
        <li className="user-profile">
          <Link className="logout-btn" onClick={handleLogOut}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;

