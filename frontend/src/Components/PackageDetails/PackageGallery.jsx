import React from 'react';
import './PackageGallery.css';
import picture from '../Assets/picture.png';

const PackageGallery = ({ images, activeImage, setActiveImage }) => {
  // Handle image load error
  const handleImageError = (e) => {
    e.target.src = picture;
  };

  // Ensure images array exists and has items
  if (!images || images.length === 0) {
    return (
      <div className="image-gallery">
        <img
          src={picture}
          alt="Default Tour"
          className="main-image"
        />
      </div>
    );
  }

  return (
    <div className="image-gallery">
      <div className="main-image-container">
        <img
          src={`https://backend-eight-tan-16.vercel.app/${images[activeImage]}`}
          alt="Tour"
          className="main-image"
          onError={handleImageError}
        />
        {/* Optional: Add navigation arrows */}
        {images.length > 1 && (
          <>
            <button 
              className="nav-button prev"
              onClick={() => setActiveImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button 
              className="nav-button next"
              onClick={() => setActiveImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </>
        )}
      </div>
      
      {images.length > 1 && (
        <div className="image-thumbnails">
          {images.map((img, index) => (
            <img
              key={index}
              src={`https://backend-eight-tan-16.vercel.app/${img}`}
              alt={`Tour ${index + 1}`}
              className={`thumbnail ${activeImage === index ? 'active' : ''}`}
              onClick={() => setActiveImage(index)}
              onError={handleImageError}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PackageGallery;
