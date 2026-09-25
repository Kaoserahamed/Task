import React, { useState, useEffect } from 'react';
import './HeroSection.css';

const HeroSection = ({ onSearch }) => {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Detect theme changes
    const detectTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      setCurrentTheme(theme);
    };

    // Initial theme detection
    detectTheme();

    // Watch for theme changes
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 100);

    return () => observer.disconnect();
  }, []);

  const handleSearch = () => {
    if (onSearch) {
      onSearch('');
    }
    window.location.href = '/search';
  };

  return (
    <div className={`hero-section ${isVisible ? 'visible' : ''}`}>
      {/* Enhanced Background with Theme Support */}
      <div className="hero-background">
        <div className={`hero-image theme-${currentTheme}`}>
          {/* Animated particles */}
          <div className="particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`particle particle-${i + 1}`}></div>
            ))}
          </div>

          {/* Dynamic shapes */}
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
            <div className="shape shape-4"></div>
          </div>
        </div>
        <div className={`hero-overlay theme-${currentTheme}`}></div>
      </div>

      <div className="hero-content">
        <div className="hero-badge">
          <span>âœ¨ New Adventures Await</span>
        </div>

        <h1 className={`hero-title theme-${currentTheme}`}>
          Discover Your Next
          <span className="gradient-text"> Adventure</span>
        </h1>

        <p className={`hero-subtitle theme-${currentTheme}`}>
          Explore the world's best destinations and create unforgettable memories
        </p>

        {/* Enhanced Search Box */}
        <div className="hero-search-container">
          <div className={`hero-search-box theme-${currentTheme}`}>
            <div className="search-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Where would you like to go?"
              readOnly
              onClick={handleSearch}
            />
            <button className="search-btn" onClick={handleSearch}>
              <span>Search</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12,5 19,12 12,19"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-label">Destinations</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">10k+</span>
            <span className="stat-label">Happy Travelers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">15+</span>
            <span className="stat-label">Years Experience</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
