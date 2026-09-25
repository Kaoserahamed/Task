import { useState } from 'react';
import { selectTourImages } from '../utils/tourImages';
import {
  EMPTY_DESTINATION,
  PACKAGE_CATEGORIES,
  TRANSPORTATION_TYPES,
  WEATHER_CONDITIONS,
  createTourFormState,
} from '../constants/tourForm';

export function useTourForm(initialDetails = {}) {
  const [tourDetails, setTourDetails] = useState(() => createTourFormState(initialDetails));
  const [imageError, setImageError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setTourDetails((current) => ({ ...current, [name]: value }));
  };

  const handleDurationChange = (event) => {
    const { name, value } = event.target;
    const parsedValue = value === '' ? '' : Math.max(0, Number.parseInt(value, 10) || 0);
    setTourDetails((current) => ({
      ...current,
      duration: { ...current.duration, [name]: parsedValue },
    }));
  };

  const handleMealChange = (meal) => {
    setTourDetails((current) => ({
      ...current,
      meals: { ...current.meals, [meal]: !current.meals[meal] },
    }));
  };

  const handleTransportationChange = (event) => {
    const { name, value } = event.target;
    setTourDetails((current) => ({
      ...current,
      transportation: { ...current.transportation, [name]: value },
    }));
  };

  const handleWeatherChange = (event) => {
    const { name, value } = event.target;
    setTourDetails((current) => ({
      ...current,
      weather: { ...current.weather, [name]: value },
    }));
  };

  const handleCategoryChange = (category) => {
    setTourDetails((current) => ({
      ...current,
      packageCategories: current.packageCategories.includes(category)
        ? current.packageCategories.filter((value) => value !== category)
        : [...current.packageCategories, category],
    }));
  };

  const handleTourTypeChange = (type) => {
    setTourDetails((current) => ({
      ...current,
      tourType: { ...current.tourType, [type]: !current.tourType[type] },
    }));
  };

  const handleArrayFieldChange = (index, field, value) => {
    setTourDetails((current) => {
      const values = [...current[field]];
      values[index] = value;
      return { ...current, [field]: values };
    });
  };

  const addArrayField = (field) => {
    setTourDetails((current) => ({ ...current, [field]: [...current[field], ''] }));
  };

  const handleDestinationsChange = (event, index, field) => {
    setTourDetails((current) => {
      const destinations = current.destinations.map((destination, destinationIndex) =>
        destinationIndex === index ? { ...destination, [field]: event.target.value } : destination
      );
      return { ...current, destinations };
    });
  };

  const addDestination = () => {
    setTourDetails((current) => ({
      ...current,
      destinations: [...current.destinations, { ...EMPTY_DESTINATION }],
    }));
  };

  const handleFileChange = (event) => {
    const result = selectTourImages(tourDetails.images, Array.from(event.target.files || []));
    setTourDetails((current) => ({ ...current, images: result.images }));
    setImageError(result.error);
  };

  const clearImageError = () => setImageError('');

  const handleRemoveImage = (index) => {
    setTourDetails((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  return {
    tourDetails,
    setTourDetails,
    packageCategories: PACKAGE_CATEGORIES,
    transportationTypes: TRANSPORTATION_TYPES,
    weatherConditions: WEATHER_CONDITIONS,
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
    imageError,
    clearImageError,
  };
}
