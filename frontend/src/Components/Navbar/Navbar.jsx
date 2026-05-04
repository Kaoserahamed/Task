import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { ThemeContext } from '../../Context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const getSurname = (fullName) => {
    if (!fullName) return 'Profile';
    const nameParts = fullName.split(' ');
    return nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
  };

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      window.location.href = '/#' + sectionId;
      return;
    }

    const section = document.getElementById(sectionId);
    const navbar = document.querySelector('.navbar');
    if (section && navbar) {
      const navbarHeight = navbar.offsetHeight;
      const sectionTop = sectionId === 'contact-section'
        ? section.offsetTop
        : section.offsetTop - navbarHeight;

      window.scrollTo({
        top: sectionTop,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <i className="fas fa-globe-americas"></i> 
          <span className="logo-text">Task</span>
        </Link>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <button 
            className="nav-item" 
            onClick={() => handleNavigation('/')}
            title="Home"
          >
            <i className="fas fa-home"></i> 
            <span className="nav-text">Home</span>
          </button>
          <button 
            className="nav-item" 
            onClick={() => handleNavigation('/populartours')}
            title="Popular Tours"
          >
            <i className="fas fa-fire"></i> 
            <span className="nav-text">Popular</span>
          </button>
          <button 
            className="nav-item" 
            onClick={() => handleNavigation('/explore')}
            title="Explore"
          >
            <i className="fas fa-compass"></i> 
            <span className="nav-text">Explore</span>
          </button>
          <button 
            className="nav-item" 
            onClick={() => handleNavigation('/review')}
            title="Reviews"
          >
            <i className="fas fa-envelope"></i> 
            <span className="nav-text">Review</span>
          </button>
          <button 
            className="nav-item" 
            onClick={() => handleNavigation('/weather')}
            title="Weather"
          >
            <i className="fas fa-cloud-sun"></i> 
            <span className="nav-text">Weather</span>
          </button>
          
          {/* Mobile auth items - only visible in mobile menu */}
          <div className="nav-auth-mobile">
            <button
              className="theme-toggle-btn mobile"
              onClick={() => {
                toggleTheme();
                setIsMenuOpen(false);
              }}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <><i className="fas fa-moon"></i> <span>Dark Mode</span></>
              ) : (
                <><i className="fas fa-sun"></i> <span>Light Mode</span></>
              )}
            </button>

            {user ? (
              <>
                <button className="profile-btn mobile" onClick={() => handleNavigation('/profile')}>
                  <i className="fas fa-user"></i>
                  <span>{getSurname(user.user?.name) || 'Profile'}</span>
                </button>
                <button onClick={handleLogout} className="logout-btn mobile">
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button className="login-btn mobile" onClick={() => handleNavigation('/login')}>
                <i className="fas fa-sign-in-alt"></i>
                <span>Login</span>
              </button>
            )}
          </div>
        </div>

        <div className="nav-auth">
          <button
            className="theme-toggle-btn desktop"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <i className="fas fa-moon"></i>
            ) : (
              <i className="fas fa-sun"></i>
            )}
          </button>

          {user ? (
            <>
              <button 
                className="profile-btn desktop" 
                onClick={() => navigate('/profile')}
                title="Profile"
              >
                <i className="fas fa-user"></i>
                <span className="auth-text">{getSurname(user.user?.name) || 'Profile'}</span>
              </button>
              <button 
                onClick={handleLogout} 
                className="logout-btn desktop"
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span className="auth-text">Logout</span>
              </button>
            </>
          ) : (
            <button 
              className="login-btn desktop" 
              onClick={() => navigate('/login')}
              title="Login"
            >
              <i className="fas fa-sign-in-alt"></i>
              <span className="auth-text">Login</span>
            </button>
          )}

          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Toggle menu"
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
