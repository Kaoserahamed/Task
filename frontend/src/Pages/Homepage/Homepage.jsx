import React, { useState } from 'react';
import { useAuth } from '../../Context/AuthContext'; // Add this import
import HeroSection from '../../Components/HeroSection/HeroSection';
import SearchFilters from '../../Components/SearchFilters/SearchFilters';
import PopularTours from '../../Components/PopularTours/PopularTours';
import UpcomingTours from '../../Components/UpcomingTours/UpcomingTours';
import Categories from '../../Components/Categories/Categories';
import WeatherRecommended from '../../Components/WeatherRecommended/WeatherRecommended';
import TrendingDestinations from '../../Components/TrendingDestinations/TrendingDestinations';
import Footer from '../../Components/Footer/Footer';
import './Homepage.css';
import TourSuggestions from '../../Components/TourSuggestions/TourSuggestions';

const Homepage = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth(); // Get user from auth context

  return (
    <>
      <div className="homepage">
        <HeroSection onSearch={setSearchQuery} />
        
        {/* Only show TourSuggestions when user is logged in */}
        {user && (
          <section id="tour-suggestions" className="tour-suggestions">
            <TourSuggestions />
          </section>
        )}
        
        {/* Add UpcomingTours section */}
        <h2>Upcoming Tours</h2>
        <section id="upcoming-section" className="upcoming-section">
          <UpcomingTours />
        </section>
        
        <section id="popular-section" className="popular-section">
          <PopularTours filter={activeFilter} searchQuery={searchQuery} />
        </section>
       
        <section id="categories-section" className="categories-section">
          <h2>Explore by Categories</h2>
          <Categories />
        </section>
       
      </div>
      <Footer />
    </>
  );
};

export default Homepage;
