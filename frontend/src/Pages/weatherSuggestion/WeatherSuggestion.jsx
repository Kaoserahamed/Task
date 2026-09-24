// Updated WeatherSuggestion component with proper city matching

import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './WeatherSuggestion.css';
import { ToursContext } from '../../Context/ToursContext';
import fallbackImage from './pexels-pixabay-76969.jpg';
import API_BASE_URL from '../../config/api';
import * as weatherApi from '../../api/weather';
import * as toursApi from '../../api/tours';
import { logDebug, logError } from '../../utils/logger';

const WeatherSuggestion = () => {
  const navigate = useNavigate();
  const { tours = [], loading: toursLoading } = useContext(ToursContext);
  const [filteredTours, setFilteredTours] = useState([]);
  const [citySearch, setCitySearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(''); // This will store the normalized city name
  const [currentWeather, setCurrentWeather] = useState(null);
  const [weatherError, setWeatherError] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Bangladesh cities
  const bangladeshCities = [
    'Dhaka',
    'Chittagong',
    'Sylhet',
    'Khulna',
    'Rajshahi',
    'Barisal',
    'Rangpur',
    'Comilla',
    'Mymensingh',
    "Cox's Bazar",
    'Bandarban',
    'Rangamati',
    'Jessore',
    'Bogra',
    'Dinajpur',
  ];

  // Normalize city names for comparison
  const normalizeCity = (cityName) => {
    if (!cityName) return '';
    return cityName.toLowerCase().trim();
  };

  // Find the proper city name from our list
  const findMatchingCity = (searchCity) => {
    const normalized = normalizeCity(searchCity);
    return (
      bangladeshCities.find(
        (city) =>
          normalizeCity(city) === normalized ||
          normalizeCity(city).includes(normalized) ||
          normalized.includes(normalizeCity(city))
      ) || searchCity
    );
  };

  // Simple weather condition similarity check
  const isWeatherSimilar = (condition1, condition2) => {
    const similar = {
      Clear: ['Sunny', 'Clear', 'Hot'],
      Sunny: ['Clear', 'Sunny', 'Hot'],
      Clouds: ['Cloudy', 'Clouds', 'Partly Cloudy'],
      Cloudy: ['Clouds', 'Cloudy', 'Partly Cloudy'],
      Rain: ['Rainy', 'Rain', 'Drizzle'],
      Rainy: ['Rain', 'Rainy', 'Drizzle'],
      Snow: ['Snowy', 'Snow', 'Cold'],
      Thunderstorm: ['Stormy', 'Thunderstorm'],
    };

    const condition1Variants = similar[condition1] || [condition1];
    const condition2Variants = similar[condition2] || [condition2];

    return (
      condition1Variants.some((c) => condition2Variants.includes(c)) ||
      condition2Variants.some((c) => condition1Variants.includes(c))
    );
  };

  // Simple temperature tolerance check (within 10 degrees)
  const isTemperatureSimilar = (temp1, temp2, tolerance = 10) => {
    return Math.abs(temp1 - temp2) <= tolerance;
  };

  // Simplified filter function with proper city matching
  // Simplified filter function - only show tours matching the searched city with similar weather
  // Simplified filter function - only show tours matching the searched city with similar weather
  const filterToursByWeather = (weatherData) => {
    logDebug('🔥 filterToursByWeather called!');
    logDebug('📊 Weather data received:', weatherData);
    logDebug('🏢 Tours array length:', tours.length);

    if (!weatherData) {
      logDebug('❌ No weather data provided');
      setFilteredTours([]);
      return;
    }

    if (!tours.length) {
      logDebug('❌ No tours available');
      setFilteredTours([]);
      return;
    }

    const currentTemp = weatherData.temp || weatherData.temperature;
    const currentCondition = weatherData.condition || weatherData.main;
    const currentCity = weatherData.city;

    logDebug('🔍 Filtering tours for:');
    logDebug('  - City:', currentCity);
    logDebug('  - Condition:', currentCondition);
    logDebug('  - Temperature:', currentTemp);

    const filtered = tours.filter((tour, index) => {
      logDebug(`\n🧪 Processing Tour #${index + 1}: ${tour.name}`);

      // Check if tour has weather data
      if (!tour.weather || !tour.weather.city) {
        logDebug('  - ❌ Tour has no weather data, excluding');
        return false;
      }

      const tourCity = tour.weather.city;
      const tourCondition = tour.weather.condition;
      const tourTemp = tour.weather.temp;

      logDebug('  - Tour city:', tourCity);
      logDebug('  - Tour condition:', tourCondition);
      logDebug('  - Tour temp:', tourTemp);

      // EXACT city match (after normalization)
      const normalizedTourCity = normalizeCity(tourCity);
      const normalizedCurrentCity = normalizeCity(currentCity);
      const cityMatch = normalizedTourCity === normalizedCurrentCity;

      logDebug('  - Normalized tour city:', normalizedTourCity);
      logDebug('  - Normalized current city:', normalizedCurrentCity);
      logDebug('  - City exact match:', cityMatch);

      // If city doesn't match exactly, exclude this tour
      if (!cityMatch) {
        logDebug("  - ❌ City doesn't match exactly, excluding tour");
        return false;
      }

      // Weather condition similarity check
      const conditionMatch =
        tourCondition && currentCondition
          ? isWeatherSimilar(currentCondition, tourCondition)
          : false;

      // Temperature similarity check (within tolerance)
      const tempMatch =
        tourTemp !== null &&
        tourTemp !== undefined &&
        currentTemp !== null &&
        currentTemp !== undefined
          ? isTemperatureSimilar(currentTemp, tourTemp)
          : false;

      logDebug(
        '  - Condition match:',
        conditionMatch,
        `(Tour: ${tourCondition}, Current: ${currentCondition})`
      );
      logDebug('  - Temp match:', tempMatch, `(Tour: ${tourTemp}, Current: ${currentTemp})`);

      // Must match city AND at least one weather parameter (condition OR temperature)
      // For stricter filtering, change to: cityMatch && conditionMatch && tempMatch
      const finalMatch = cityMatch && (conditionMatch || tempMatch);

      // For VERY strict filtering (all must match), use this instead:
      // const finalMatch = cityMatch && conditionMatch && tempMatch;

      logDebug('  - Final match result:', finalMatch);

      return finalMatch;
    });

    logDebug('✅ Filtered tours count:', filtered.length);
    logDebug('✅ Filtered tours:', filtered);

    // Sort by weather similarity (temperature difference first, then condition)
    const sorted = filtered.sort((a, b) => {
      // Primary sort: temperature difference
      const aTempDiff =
        a.weather?.temp !== null && a.weather?.temp !== undefined
          ? Math.abs(currentTemp - a.weather.temp)
          : 999;
      const bTempDiff =
        b.weather?.temp !== null && b.weather?.temp !== undefined
          ? Math.abs(currentTemp - b.weather.temp)
          : 999;

      if (aTempDiff !== bTempDiff) {
        return aTempDiff - bTempDiff;
      }

      // Secondary sort: condition match (exact matches first)
      const aConditionMatch = a.weather?.condition === currentCondition ? 0 : 1;
      const bConditionMatch = b.weather?.condition === currentCondition ? 0 : 1;

      return aConditionMatch - bConditionMatch;
    });

    logDebug('✅ Final sorted tours:', sorted);
    setFilteredTours(sorted);
  };
  const fetchCityWeather = async (cityName) => {
    logDebug('🌤️ Fetching weather for:', cityName);

    const matchingCity = findMatchingCity(cityName);
    logDebug('🎯 Matching city found:', matchingCity);

    if (!bangladeshCities.some((city) => normalizeCity(city) === normalizeCity(matchingCity))) {
      const errorMsg = `${cityName} is not a valid city in our list.`;
      logDebug('❌', errorMsg);
      setWeatherError(errorMsg);
      return;
    }

    if (!cityName.trim()) {
      logDebug('❌ Empty city name');
      return;
    }

    setWeatherLoading(true);
    setWeatherError('');

    try {
      const data = await weatherApi.fetchWeather(cityName);

      if (data && (data.weather || data.temp)) {
        const weatherData = {
          city: data.city || matchingCity,
          condition: data.weather,
          temp: data.temp,
          description: data.weather,
          humidity: data.humidity,
          windSpeed: data.windSpeed,
        };

        setCurrentWeather(weatherData);
        setSelectedCity(weatherData.city);

        // Call filterToursByWeather with weather data
        filterToursByWeather(weatherData);
      } else {
        throw new Error('Weather data not available');
      }
    } catch (err) {
      logError('❌ Error fetching weather:', err);
      const errorMsg = `Could not fetch weather data for ${cityName}. Please try another city.`;
      setWeatherError(errorMsg);
      setCurrentWeather(null);
      setFilteredTours([]);
      setSelectedCity('');
    }
    setWeatherLoading(false);
  };

  const handleCitySearch = (e) => {
    e.preventDefault();
    if (citySearch.trim()) {
      fetchCityWeather(citySearch.trim());
    }
  };

  const handleQuickCitySelect = (city) => {
    setCitySearch(city);
    fetchCityWeather(city);
  };

  const handleTourClick = async (tourId) => {
    try {
      await toursApi.incrementTourView(tourId);
      navigate(`/package/${tourId}`);
    } catch (error) {
      logError('Failed to increment view count:', error);
      navigate(`/package/${tourId}`);
    }
  };

  // Combined loading state
  const isLoading = toursLoading || weatherLoading;

  return (
    <div className="weather-container">
      {/* Search Section */}
      <div className="search-section">
        <form onSubmit={handleCitySearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="🔍 Enter city name (e.g., Dhaka, Chittagong)"
              className="search-bar"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
            />
            <button type="submit" className="search-btn" disabled={isLoading}>
              {weatherLoading ? '⏳' : '🔍'}
            </button>
          </div>
        </form>

        {/* Quick City Selection */}
        <div className="quick-cities">
          <h4>Popular Cities:</h4>
          <div className="city-buttons">
            {bangladeshCities.map((city) => (
              <button
                key={city}
                onClick={() => handleQuickCitySelect(city)}
                className={`city-btn ${normalizeCity(selectedCity) === normalizeCity(city) ? 'active' : ''}`}
                disabled={isLoading}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Weather Error */}
      {weatherError && (
        <div className="weather-error">
          <p>⚠️ {weatherError}</p>
        </div>
      )}

      {/* Current Weather Display */}
      {currentWeather && (
        <div className="current-weather">
          <div className="weather-card">
            <h3>📍 {currentWeather.city}</h3>
            <div className="weather-details">
              <div className="temperature">{currentWeather.temp}°C</div>
              <div className="condition">{currentWeather.condition}</div>

              <div className="additional-info">
                {currentWeather.humidity && <span>💧 Humidity: {currentWeather.humidity}%</span>}
                {currentWeather.windSpeed && <span>💨 Wind: {currentWeather.windSpeed} m/s</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading">
          <p>
            🔄 {toursLoading ? 'Loading tours...' : 'Loading weather and tour recommendations...'}
          </p>
        </div>
      )}

      {/* Filtered Tours */}
      {currentWeather && !isLoading && (
        <div className="tours-section">
          <div className="section-header">
            <h3>🎯 Tours for {currentWeather.city}</h3>
            <p>
              Showing tours matching {currentWeather.condition} weather at {currentWeather.temp}°C
            </p>
          </div>

          {filteredTours.length > 0 ? (
            <div className="city-grid">
              {filteredTours.map((tour) => {
                const isSameCity =
                  normalizeCity(tour.weather?.city || '') === normalizeCity(currentWeather.city);
                const imageUrl = tour.images?.length
                  ? `${API_BASE_URL}/${tour.images[0]}`
                  : 'https://picsum.photos/300/200';

                return (
                  <div key={tour._id} className="explore-tour-card">
                    <div className="explore-tour-image">
                      <img
                        src={imageUrl}
                        alt={tour.name}
                        onError={(e) => {
                          e.target.src = 'https://picsum.photos/300/200';
                        }}
                      />
                      {isSameCity && <span className="tour-completed-tag">📍 Same City</span>}
                    </div>

                    <div className="explore-tour-info">
                      <h3>{tour.name || 'Untitled Tour'}</h3>
                      <div className="explore-tour-details">
                        <span>
                          💰 Price: <strong>${tour.price ?? 'N/A'}</strong>
                        </span>
                        <span>🌤️ Weather: {tour.weather?.condition || 'N/A'}</span>
                        <span>🌡️ Temp: {tour.weather?.temp || 'N/A'}°C</span>
                        <span>📍 Location: {tour.weather?.city || 'Unknown'}</span>
                        <span>⏱️ Duration: {tour.duration?.days || 'N/A'} days</span>
                      </div>
                      <div className="explore-tour-actions">
                        <button
                          onClick={() => handleTourClick(tour._id)}
                          className="explore-view-details-btn"
                        >
                          View Details <i className="fas fa-arrow-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-tours">
              <p>😔 No tours found matching the weather conditions in {currentWeather.city}</p>
              <p>Try searching for a different city or check our other tours!</p>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!currentWeather && !isLoading && (
        <div className="initial-state">
          <div className="welcome-message">
            <h3>🗺️ Welcome to Weather-Based Tour Discovery</h3>
            <p>
              Search for any city in Bangladesh to find tours that match the current weather
              conditions
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherSuggestion;
