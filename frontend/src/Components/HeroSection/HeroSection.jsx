import React, { useState, useEffect } from 'react';

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
      attributeFilter: ['data-theme']
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
          <span>✨ New Adventures Await</span>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      
      <style jsx>{`
        .hero-section {
          position: relative;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: white;
          opacity: 0;
          transform: translateY(20px);
          transition: all 1s ease-out;
        }

        .hero-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
        }

        /* Light Theme Background */
        .hero-image.theme-light {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, 
            #667eea 0%, 
            #764ba2 25%, 
            #f093fb 50%, 
            #f5576c 75%, 
            #4facfe 100%
          );
          background-size: 400% 400%;
          animation: gradientShift 12s ease infinite;
          position: relative;
        }

        /* Dark Theme Background */
        .hero-image.theme-dark {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, 
            #2c3e50 0%, 
            #3498db 25%, 
            #9b59b6 50%, 
            #e74c3c 75%, 
            #1abc9c 100%
          );
          background-size: 400% 400%;
          animation: gradientShift 12s ease infinite;
          position: relative;
        }

        /* Enhanced Visual Elements */
        .hero-image::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><pattern id="mountains" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse"><polygon fill="%23ffffff08" points="0,200 50,120 100,160 150,80 200,140 200,200"/><polygon fill="%23ffffff05" points="0,200 40,140 80,170 120,100 160,150 200,90 200,200"/><circle cx="150" cy="50" r="20" fill="%23ffffff03"/><circle cx="80" cy="30" r="15" fill="%23ffffff04"/></pattern></defs><rect width="100%" height="100%" fill="url(%23mountains)"/></svg>');
          opacity: 0.6;
        }

        /* Floating Particles */
        .particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          animation: particleFloat 8s linear infinite;
        }

        .particle-1 { left: 10%; animation-delay: 0s; }
        .particle-2 { left: 20%; animation-delay: 1s; }
        .particle-3 { left: 30%; animation-delay: 2s; }
        .particle-4 { left: 40%; animation-delay: 3s; }
        .particle-5 { left: 50%; animation-delay: 4s; }
        .particle-6 { left: 60%; animation-delay: 0.5s; }
        .particle-7 { left: 70%; animation-delay: 1.5s; }
        .particle-8 { left: 80%; animation-delay: 2.5s; }
        .particle-9 { left: 90%; animation-delay: 3.5s; }
        .particle-10 { left: 15%; animation-delay: 5s; }
        .particle-11 { left: 25%; animation-delay: 6s; }
        .particle-12 { left: 35%; animation-delay: 7s; }
        .particle-13 { left: 45%; animation-delay: 0.8s; }
        .particle-14 { left: 55%; animation-delay: 1.8s; }
        .particle-15 { left: 65%; animation-delay: 2.8s; }
        .particle-16 { left: 75%; animation-delay: 3.8s; }
        .particle-17 { left: 85%; animation-delay: 4.8s; }
        .particle-18 { left: 95%; animation-delay: 5.8s; }
        .particle-19 { left: 5%; animation-delay: 6.8s; }
        .particle-20 { left: 95%; animation-delay: 7.8s; }

        /* Floating Shapes */
        .floating-shapes {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .shape {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          animation: shapeFloat 10s ease-in-out infinite;
        }

        .shape-1 {
          width: 120px;
          height: 120px;
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 80px;
          height: 80px;
          top: 60%;
          right: 15%;
          animation-delay: 3s;
        }

        .shape-3 {
          width: 60px;
          height: 60px;
          bottom: 30%;
          left: 20%;
          animation-delay: 6s;
        }

        .shape-4 {
          width: 100px;
          height: 100px;
          top: 40%;
          right: 30%;
          animation-delay: 9s;
        }

        /* Theme-specific overlays */
        .hero-overlay.theme-light {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.3) 0%,
            rgba(0, 0, 0, 0.1) 50%,
            rgba(0, 0, 0, 0.2) 100%
          );
        }

        .hero-overlay.theme-dark {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.5) 0%,
            rgba(0, 0, 0, 0.3) 50%,
            rgba(0, 0, 0, 0.4) 100%
          );
        }

        .hero-content {
          text-align: center;
          max-width: 900px;
          padding: 0 20px;
          z-index: 2;
          animation: contentFadeIn 1.5s ease-out 0.5s both;
        }

        .hero-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 25px;
          padding: 8px 20px;
          margin-bottom: 2rem;
          font-size: 0.9rem;
          font-weight: 500;
          animation: badgePulse 3s ease-in-out infinite;
        }

        .hero-title {
          font-size: 4.5rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          line-height: 1.1;
        }

        .hero-title.theme-light {
          color: #ffffff;
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.4);
        }

        .hero-title.theme-dark {
          color: #f0f0f0;
          text-shadow: 2px 2px 12px rgba(0, 0, 0, 0.6);
        }

        .gradient-text {
          background: linear-gradient(45deg, #ffd700, #ff6b6b, #4ecdc4, #45b7d1);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: textGradient 4s ease infinite;
        }

        .hero-subtitle {
          font-size: 1.4rem;
          margin-bottom: 3rem;
          font-weight: 300;
          line-height: 1.6;
        }

        .hero-subtitle.theme-light {
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.3);
        }

        .hero-subtitle.theme-dark {
          color: rgba(240, 240, 240, 0.8);
          text-shadow: 1px 1px 6px rgba(0, 0, 0, 0.5);
        }

        .hero-search-container {
          display: flex;
          justify-content: center;
          margin-bottom: 3rem;
        }

        .hero-search-box {
          display: flex;
          align-items: center;
          border-radius: 60px;
          padding: 6px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          max-width: 650px;
          width: 100%;
          transition: all 0.4s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .hero-search-box.theme-light {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
        }

        .hero-search-box.theme-dark {
          background: rgba(45, 55, 72, 0.9);
          backdrop-filter: blur(20px);
        }

        .hero-search-box:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 50px rgba(0, 0, 0, 0.2);
        }

        .search-icon {
          padding: 16px 24px;
          display: flex;
          align-items: center;
        }

        .hero-search-box.theme-light .search-icon {
          color: #666;
        }

        .hero-search-box.theme-dark .search-icon {
          color: #cbd5e0;
        }

        .hero-search-box input {
          flex: 1;
          border: none;
          outline: none;
          padding: 16px 12px;
          font-size: 1.1rem;
          background: transparent;
          cursor: pointer;
        }

        .hero-search-box.theme-light input {
          color: #333;
        }

        .hero-search-box.theme-dark input {
          color: #f0f0f0;
        }

        .hero-search-box input::placeholder {
          color: #888;
        }

        .search-btn {
          background: linear-gradient(45deg, #ff6b6b, #ee5a24);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(255, 107, 107, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-btn:hover {
          background: linear-gradient(45deg, #ee5a24, #ff6b6b);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
        }

        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 3rem;
          opacity: 0.9;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #ffd700;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        /* Animations */
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes particleFloat {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes shapeFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(10px) rotate(240deg); }
        }

        @keyframes contentFadeIn {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes textGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .hero-title {
            font-size: 3rem;
          }
          
          .hero-subtitle {
            font-size: 1.2rem;
          }
          
          .hero-search-box {
            margin: 0 20px;
          }
          
          .search-btn {
            padding: 14px 24px;
            font-size: 1rem;
          }

          .hero-stats {
            gap: 2rem;
          }

          .stat-number {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 2.2rem;
          }
          
          .hero-search-box {
            flex-direction: column;
            padding: 20px;
            border-radius: 25px;
            gap: 15px;
          }
          
          .hero-search-box input {
            width: 100%;
            text-align: center;
            padding: 12px;
          }
          
          .search-btn {
            width: 100%;
            justify-content: center;
          }

          .hero-stats {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroSection;
