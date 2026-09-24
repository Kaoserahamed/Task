import React, { useEffect, useState } from 'react';
import { useTourForm } from '../../hooks/useTourForm';
import { useParams, useNavigate } from 'react-router-dom';
import './EditTour.css';
import API_BASE_URL from '../../config/api';
import * as toursApi from '../../api/tours';
import { logError } from '../../utils/logger';

const EditTour = () => {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    tourDetails,
    setTourDetails,
    packageCategories,
    transportationTypes,
    weatherConditions,
    handleChange,
    handleDurationChange,
    handleMealChange,
    handleTransportationChange,
    handleWeatherChange,
    handleCategoryChange,
    handleTourTypeChange,
    handleArrayFieldChange,
    addArrayField,
    handleDestinationsChange,
    addDestination,
    handleFileChange,
    handleRemoveImage,
  } = useTourForm();

  useEffect(() => {
    fetchTourDetails();
  }, [tourId]);

  const fetchTourDetails = async () => {
    try {
      const data = await toursApi.fetchTour(tourId);

      if (data.success) {
        const tour = data.tour;
        setTourDetails({
          ...tour,
          startDate: tour.startDate ? tour.startDate.split('T')[0] : '',
          endDate: tour.endDate ? tour.endDate.split('T')[0] : '',
          packageCategories: tour.packageCategories || [],
          customCategory: tour.customCategory || '',
          tourType: tour.tourType || { single: false, group: false },
          meals: tour.meals || { breakfast: false, lunch: false, dinner: false },
          transportation: tour.transportation || { type: '', details: '' },
          destinations: tour.destinations || [{ name: '', description: '', stayDuration: '' }],
          includes: tour.includes || [''],
          excludes: tour.excludes || [''],
          weather: tour.weather || { city: '', condition: '', temp: '' },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch tour details');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    if (!tourDetails.tourType.single && !tourDetails.tourType.group) {
      alert('Please select at least one tour type (Single or Group)');
      return;
    }

    if (tourDetails.packageCategories.length === 0 && !tourDetails.customCategory) {
      alert('Please select at least one category or add a custom category');
      return;
    }

    Object.keys(tourDetails).forEach((key) => {
      if (key === 'images') {
        tourDetails.images.forEach((image) => {
          if (image instanceof File) {
            formData.append('newImages', image);
          }
        });
        formData.append(
          'existingImages',
          JSON.stringify(tourDetails.images.filter((img) => !(img instanceof File)))
        );
      } else if (typeof tourDetails[key] === 'object') {
        formData.append(key, JSON.stringify(tourDetails[key]));
      } else {
        formData.append(key, tourDetails[key]);
      }
    });

    try {
      await toursApi.updateTour(tourId, formData);
      alert('Tour updated successfully');
      navigate('/manage-tours');
    } catch (error) {
      logError('Error updating tour:', error);
      alert(`Failed to update tour: ${error.message}`);
    }
  };

  if (loading) return <div className="loading">Loading tour details...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="upload-tour">
      <h1>Edit Tour Package</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Basic Information</h2>
          <input
            type="text"
            name="name"
            placeholder="Package Name"
            value={tourDetails.name}
            onChange={handleChange}
            required
          />

          <div className="categories-section">
            <h3>Package Categories</h3>
            <div className="checkbox-group categories">
              {packageCategories.map((category) => (
                <label key={category}>
                  <input
                    type="checkbox"
                    checked={tourDetails.packageCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                  />
                  {category}
                </label>
              ))}
            </div>
            <input
              type="text"
              name="customCategory"
              placeholder="Custom Category (optional)"
              value={tourDetails.customCategory}
              onChange={handleChange}
            />
          </div>

          <div className="tour-type-section">
            <h3>Tour Type</h3>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={tourDetails.tourType.single}
                  onChange={() => handleTourTypeChange('single')}
                />
                Single
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={tourDetails.tourType.group}
                  onChange={() => handleTourTypeChange('group')}
                />
                Group
              </label>
            </div>
          </div>

          <div className="duration-inputs">
            <input
              type="number"
              name="days"
              placeholder="Days"
              value={tourDetails.duration?.days || ''}
              onChange={handleDurationChange}
              min="1"
              step="1"
              required
            />
            <input
              type="number"
              name="nights"
              placeholder="Nights"
              value={tourDetails.duration?.nights || ''}
              onChange={handleDurationChange}
              min="0"
              step="1"
              required
            />
          </div>

          {tourDetails.tourType.group && (
            <div className="group-details">
              <input
                type="number"
                name="maxGroupSize"
                placeholder="Maximum Group Size"
                value={tourDetails.maxGroupSize}
                onChange={handleChange}
                min="1"
              />
              <input
                type="number"
                name="availableSeats"
                placeholder="Available Seats"
                value={tourDetails.availableSeats}
                onChange={handleChange}
                min="0"
              />
              <input
                type="date"
                name="startDate"
                value={tourDetails.startDate}
                onChange={handleChange}
                required
              />
              <input
                type="date"
                name="endDate"
                value={tourDetails.endDate}
                onChange={handleChange}
                required
              />
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>Services & Amenities</h2>
          <div className="meals-section">
            <h3>Meals Included</h3>
            <div className="checkbox-group">
              {Object.keys(tourDetails.meals).map((meal) => (
                <label key={meal}>
                  <input
                    type="checkbox"
                    checked={tourDetails.meals[meal]}
                    onChange={() => handleMealChange(meal)}
                  />
                  {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="transportation-section">
            <h3>Transportation</h3>
            <select
              name="type"
              value={tourDetails.transportation.type}
              onChange={handleTransportationChange}
              required
            >
              <option value="">Select Transportation Type</option>
              {transportationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="details"
              placeholder="Transportation Details"
              value={tourDetails.transportation.details}
              onChange={handleTransportationChange}
            />
          </div>

          <div className="tour-guide-section">
            <label>
              <input
                type="checkbox"
                checked={tourDetails.tourGuide}
                onChange={(e) =>
                  setTourDetails({
                    ...tourDetails,
                    tourGuide: e.target.checked,
                  })
                }
              />
              Tour Guide Available
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>Destinations</h2>
          {tourDetails.destinations.map((destination, index) => (
            <div key={index} className="destination-input">
              <input
                type="text"
                placeholder="Destination Name"
                value={destination.name}
                onChange={(e) => handleDestinationsChange(e, index, 'name')}
                required
              />
              <textarea
                placeholder="Destination Description"
                value={destination.description}
                onChange={(e) => handleDestinationsChange(e, index, 'description')}
                required
              />
              <input
                type="text"
                placeholder="Stay Duration (e.g., 2 days)"
                value={destination.stayDuration}
                onChange={(e) => handleDestinationsChange(e, index, 'stayDuration')}
                required
              />
            </div>
          ))}
          <button type="button" onClick={addDestination}>
            Add Destination
          </button>
        </div>

        <div className="form-section">
          <h2>Package Details</h2>
          <div className="includes-section">
            {tourDetails.includes.map((item, index) => (
              <input
                key={index}
                type="text"
                placeholder="What's Included?"
                value={item}
                onChange={(e) => handleArrayFieldChange(index, 'includes', e.target.value)}
              />
            ))}
            <button type="button" onClick={() => addArrayField('includes')}>
              Add Included Item
            </button>
          </div>

          <div className="excludes-section">
            {tourDetails.excludes.map((item, index) => (
              <input
                key={index}
                type="text"
                placeholder="What's Not Included?"
                value={item}
                onChange={(e) => handleArrayFieldChange(index, 'excludes', e.target.value)}
              />
            ))}
            <button type="button" onClick={() => addArrayField('excludes')}>
              Add Excluded Item
            </button>
          </div>

          <textarea
            name="specialNote"
            placeholder="Special Notes"
            value={tourDetails.specialNote}
            onChange={handleChange}
          />

          <textarea
            name="cancellationPolicy"
            placeholder="Cancellation Policy"
            value={tourDetails.cancellationPolicy}
            onChange={handleChange}
          />

          <input
            type="number"
            name="price"
            placeholder="Package Price"
            value={tourDetails.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-section">
          <h2>Weather Information</h2>
          <div className="weather-section">
            <input
              type="text"
              name="city"
              placeholder="Weather City/Location"
              value={tourDetails.weather?.city || ''}
              onChange={handleWeatherChange}
            />
            <select
              name="condition"
              value={tourDetails.weather?.condition || ''}
              onChange={handleWeatherChange}
            >
              <option value="">Select Weather Condition</option>
              {weatherConditions.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="temp"
              placeholder="Average Temperature (°C)"
              value={tourDetails.weather?.temp || ''}
              onChange={handleWeatherChange}
              step="0.1"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Images</h2>
          <div className="file-upload">
            <input type="file" multiple onChange={handleFileChange} accept="image/*" />
            <div className="image-preview">
              {tourDetails.images.map((image, index) => (
                <div key={index} className="image-preview-item">
                  <img
                    src={
                      image instanceof File
                        ? URL.createObjectURL(image)
                        : `${API_BASE_URL}/${image}`
                    }
                    alt={`preview-${index}`}
                    className="image-thumbnail"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="remove-image-button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" className="submit-button">
          Update Package
        </button>
      </form>
    </div>
  );
};

export default EditTour;
