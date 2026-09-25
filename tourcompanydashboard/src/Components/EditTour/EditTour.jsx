import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTourForm } from '../../hooks/useTourForm';
import * as toursApi from '../../api/tours';
import { logError } from '../../utils/logger';
import validateTourForm from '../../validators/tourForm';
import { buildTourUpdateFormData, toEditableTour } from '../../utils/tourPayload';
import BasicInfoSection from '../TourFormSections/BasicInfoSection';
import ServicesSection from '../TourFormSections/ServicesSection';
import DestinationsSection from '../TourFormSections/DestinationsSection';
import PackageDetailsSection from '../TourFormSections/PackageDetailsSection';
import WeatherSection from '../TourFormSections/WeatherSection';
import ImagesSection from '../TourFormSections/ImagesSection';
import './EditTour.css';

/**
 * Edit form for an existing tour package.
 *
 * The component owns the request lifecycle — load, validate, PUT, navigate —
 * while each form section is a presentational child and all field state lives in
 * `useTourForm`. The API response normalisation and the multipart body are pure
 * helpers in `utils/tourPayload.js`.
 */
const EditTour = () => {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
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
    imageError,
    clearImageError,
  } = useTourForm();

  useEffect(() => {
    fetchTourDetails();
    // fetchTourDetails is a stable loader for the id in the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  const fetchTourDetails = async () => {
    try {
      const data = await toursApi.fetchTour(tourId);

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch tour details');
      }

      setTourDetails(toEditableTour(data.tour));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormStatus({ type: '', message: '' });

    const validation = validateTourForm(tourDetails);
    if (!validation.valid) {
      setFormStatus({ type: 'error', message: validation.message });
      return;
    }

    try {
      await toursApi.updateTour(tourId, buildTourUpdateFormData(tourDetails));
      setFormStatus({ type: 'success', message: 'Tour updated successfully.' });
      navigate('/manage-tours');
    } catch (err) {
      logError('Error updating tour:', err);
      setFormStatus({ type: 'error', message: `Failed to update tour: ${err.message}` });
    }
  };

  if (loading) return <div className="loading">Loading tour details...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="upload-tour">
      <h1>Edit Tour Package</h1>
      <form onSubmit={handleSubmit}>
        {formStatus.message && (
          <p
            className={`form-status form-status--${formStatus.type}`}
            role={formStatus.type === 'error' ? 'alert' : 'status'}
          >
            {formStatus.message}
          </p>
        )}
        <BasicInfoSection
          tourDetails={tourDetails}
          packageCategories={packageCategories}
          handleChange={handleChange}
          handleDurationChange={handleDurationChange}
          handleCategoryChange={handleCategoryChange}
          handleTourTypeChange={handleTourTypeChange}
        />
        <ServicesSection
          tourDetails={tourDetails}
          transportationTypes={transportationTypes}
          handleMealChange={handleMealChange}
          handleTransportationChange={handleTransportationChange}
          setTourDetails={setTourDetails}
        />
        <DestinationsSection
          tourDetails={tourDetails}
          handleDestinationsChange={handleDestinationsChange}
          addDestination={addDestination}
        />
        <PackageDetailsSection
          tourDetails={tourDetails}
          handleChange={handleChange}
          handleArrayFieldChange={handleArrayFieldChange}
          addArrayField={addArrayField}
        />
        <WeatherSection
          tourDetails={tourDetails}
          weatherConditions={weatherConditions}
          handleWeatherChange={handleWeatherChange}
        />
        <ImagesSection
          tourDetails={tourDetails}
          handleFileChange={handleFileChange}
          handleRemoveImage={handleRemoveImage}
          imageError={imageError}
          clearImageError={clearImageError}
        />

        <button type="submit" className="submit-button">
          Update Package
        </button>
      </form>
    </div>
  );
};

export default EditTour;
