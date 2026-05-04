import React, { useState ,useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import './UploadTour.css';  // Import the CSS file for styling
import { useAuth } from '../../Context/AuthContext';

const UploadTour = () => {
  const {company}=useAuth();
  useEffect(() => {
    if (company) {
      console.log("Current logged in company:", company);
      console.log("Company ID:", company._id);
    }
  }, [company]);
const companyId=company.company._id;
const companyName=company.company.name;
const navigate = useNavigate();
console.log(companyName);
  const [tourDetails, setTourDetails] = useState({
    name: '',
    packageCategories: [],
    customCategory: '',
    tourType: {
      single: false, // Remove this line if not needed elsewhere
      group: true
    },
    duration: {
      days: '',
      nights: ''
    },
    startDate: '',
    endDate: '',
    meals: {
      breakfast: false,
      lunch: false,
      dinner: false
    },
    transportation: {
      type: '',
      details: ''
    },
    tourGuide: false,
    price: '',
    maxGroupSize: '',
    availableSeats: '',
    destinations: [{ 
      name: '', 
      description: '',
      stayDuration: '' 
    }],
    images: [],
    includes: [''], // Additional included services
    excludes: [''], // What's not included
    specialNote: '',
    cancellationPolicy: '',
    weather: {
      city: '',
      condition: '',
      temp: ''
    }
  });

  const packageCategories = [
    'Adventure',
    'Cultural',
    'Nature & Eco',
    'Family',
    'Honeymoon',
    'Educational',
    'Seasonal'
  ];

  const transportationTypes = [
    'Bus',
    'Mini Bus',
    'Car',
    'Premium Car',
    'Other'
  ];

  const weatherConditions = [
    'Sunny',
    'Partly Cloudy',
    'Cloudy',
    'Rainy',
    'Stormy',
    'Snowy',
    'Foggy',
    'Hot',
    'Cold',
    'Mild'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTourDetails({
      ...tourDetails,
      [name]: value
    });
  };

  const handleDurationChange = (e) => {
    const { name, value } = e.target;
    // Ensure value is a positive integer or empty string
    const parsedValue = value === '' ? '' : Math.max(0, parseInt(value) || 0);
    
    setTourDetails({
      ...tourDetails,
      duration: {
        ...tourDetails.duration,
        [name]: parsedValue
      }
    });
  };

  const handleMealChange = (meal) => {
    setTourDetails({
      ...tourDetails,
      meals: {
        ...tourDetails.meals,
        [meal]: !tourDetails.meals[meal]
      }
    });
  };

  const handleTransportationChange = (e) => {
    const { name, value } = e.target;
    setTourDetails({
      ...tourDetails,
      transportation: {
        ...tourDetails.transportation,
        [name]: value
      }
    });
  };

  const handleWeatherChange = (e) => {
    const { name, value } = e.target;
    setTourDetails({
      ...tourDetails,
      weather: {
        ...tourDetails.weather,
        [name]: value
      }
    });
  };

  const handleArrayFieldChange = (index, field, value) => {
    const updatedArray = [...tourDetails[field]];
    updatedArray[index] = value;
    setTourDetails({
      ...tourDetails,
      [field]: updatedArray
    });
  };

  const addArrayField = (field) => {
    setTourDetails({
      ...tourDetails,
      [field]: [...tourDetails[field], '']
    });
  };

  const handleDestinationsChange = (e, index, field) => {
    const { value } = e.target;
    const newDestinations = [...tourDetails.destinations];
    newDestinations[index][field] = value;
    setTourDetails({
      ...tourDetails,
      destinations: newDestinations
    });
  };

  const addDestination = () => {
    setTourDetails({
      ...tourDetails,
      destinations: [...tourDetails.destinations, { name: '', description: '', stayDuration: '' }]
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setTourDetails({
      ...tourDetails,
      images: [...tourDetails.images, ...files]
    });
  };

  const handleCategoryChange = (category) => {
    setTourDetails(prev => ({
      ...prev,
      packageCategories: prev.packageCategories.includes(category)
        ? prev.packageCategories.filter(c => c !== category)
        : [...prev.packageCategories, category]
    }));
  };

  const handleTourTypeChange = (type) => {
    setTourDetails(prev => ({
      ...prev,
      tourType: {
        ...prev.tourType,
        [type]: !prev.tourType[type]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
  
    // Add validation for tour type
    if (!tourDetails.tourType.single && !tourDetails.tourType.group) {
      alert('Please select at least one tour type (Single or Group)');
      return;
    }

    // Add validation for categories
    if (tourDetails.packageCategories.length === 0 && !tourDetails.customCategory) {
      alert('Please select at least one category or add a custom category');
      return;
    }

    formData.append('name', tourDetails.name);
    formData.append('packageCategories', JSON.stringify(tourDetails.packageCategories));
    formData.append('customCategory', tourDetails.customCategory);
    formData.append('tourType', JSON.stringify(tourDetails.tourType));
    formData.append('duration', JSON.stringify(tourDetails.duration));
    formData.append('startDate', tourDetails.startDate);
    formData.append('endDate', tourDetails.endDate);
    formData.append('meals', JSON.stringify(tourDetails.meals));
    formData.append('transportation', JSON.stringify(tourDetails.transportation));
    formData.append('tourGuide', tourDetails.tourGuide);
    formData.append('price', tourDetails.price);
    formData.append('maxGroupSize', tourDetails.maxGroupSize);
    formData.append('availableSeats', tourDetails.availableSeats);
    formData.append('destinations', JSON.stringify(tourDetails.destinations));
    formData.append('includes', JSON.stringify(tourDetails.includes));
    formData.append('excludes', JSON.stringify(tourDetails.excludes));
    formData.append('specialNote', tourDetails.specialNote);
    formData.append('cancellationPolicy', tourDetails.cancellationPolicy);
    formData.append('weather', JSON.stringify(tourDetails.weather));
    formData.append('companyId',companyId);
    formData.append('companyName',companyName);
    
    tourDetails.images.forEach((image) => {
      formData.append('images', image);
    });
  
    try {
      const response = await fetch('https://backend-eight-tan-16.vercel.app/api/tours', {
        method: 'POST',
        body: formData,
      });
  
      const result = await response.json();
      if (response.ok) {
        alert('Tour uploaded successfully');
        console.log(result);
        navigate('manage-tours'); // Redirect to manage tours page
      } else {
        alert(`Failed to upload tour: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading tour:', error);
      alert('An error occurred while uploading the tour');
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = tourDetails.images.filter((_, i) => i !== index);
    setTourDetails({
      ...tourDetails,
      images: updatedImages
    });
  };

  return (
    <div className="upload-tour">
      <h1>Create New Tour Package</h1>
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
              {/* Remove Single option */}
              <label>
                <input
                  type="checkbox"
                  checked={tourDetails.tourType.group}
                  onChange={() => {}}
                  disabled
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
              value={tourDetails.duration.days}
              onChange={handleDurationChange}
              min="1"
              step="1"
              required
            />
            <input
              type="number"
              name="nights"
              placeholder="Nights"
              value={tourDetails.duration.nights}
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
          <h2>Weather Information</h2>
          <div className="weather-section">
            <input
              type="text"
              name="city"
              placeholder="Weather City/Location"
              value={tourDetails.weather.city}
              onChange={handleWeatherChange}
            />
            <select
              name="condition"
              value={tourDetails.weather.condition}
              onChange={handleWeatherChange}
            >
              <option value="">Select Weather Condition</option>
              {weatherConditions.map((condition) => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
            <input
              type="number"
              name="temp"
              placeholder="Average Temperature (°C)"
              value={tourDetails.weather.temp}
              onChange={handleWeatherChange}
              step="0.1"
            />
          </div>
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
                <option key={type} value={type}>{type}</option>
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
                onChange={(e) => setTourDetails({
                  ...tourDetails,
                  tourGuide: e.target.checked
                })}
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
          <button type="button" onClick={addDestination}>Add Destination</button>
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
          <h2>Images</h2>
          <div className="file-upload">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept="image/*"
            />
            <div className="image-preview">
                            {tourDetails.images.map((image, index) => (
                <div key={index} className="image-preview-item">
                  <img
                    src={URL.createObjectURL(image)}
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

        <button type="submit" className="submit-button">Create Package</button>
      </form>
    </div>
  );
};

export default UploadTour;
