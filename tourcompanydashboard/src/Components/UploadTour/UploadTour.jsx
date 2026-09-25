import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as toursApi from '../../api/tours';
import { useAuth } from '../../Context/AuthContext';
import { useTourForm } from '../../hooks/useTourForm';
import { logError } from '../../utils/logger';
import { buildTourCreateFormData } from '../../utils/tourPayload';
import validateTourForm from '../../validators/tourForm';
import BasicInfoSection from '../TourFormSections/BasicInfoSection';
import DestinationsSection from '../TourFormSections/DestinationsSection';
import ImagesSection from '../TourFormSections/ImagesSection';
import PackageDetailsSection from '../TourFormSections/PackageDetailsSection';
import ServicesSection from '../TourFormSections/ServicesSection';
import WeatherSection from '../TourFormSections/WeatherSection';
import './UploadTour.css';

/** Create form for a new group-tour package. */
const UploadTourPage = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    handleArrayFieldChange,
    addArrayField,
    handleDestinationsChange,
    addDestination,
    handleFileChange,
    handleCategoryChange,
    handleRemoveImage,
    imageError,
    clearImageError,
  } = useTourForm({ tourType: { single: false, group: true } });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormStatus({ type: '', message: '' });

    if (!company?.company?._id) {
      setFormStatus({ type: 'error', message: 'Sign in as a company before creating a tour.' });
      return;
    }

    const validation = validateTourForm(tourDetails);
    if (!validation.valid) {
      setFormStatus({ type: 'error', message: validation.message });
      return;
    }

    setIsSubmitting(true);
    try {
      await toursApi.createTour(buildTourCreateFormData(tourDetails, company.company));
      setFormStatus({ type: 'success', message: 'Tour uploaded successfully.' });
      setIsSubmitting(false);
      navigate('/manage-tours');
    } catch (error) {
      logError('Error uploading tour:', error);
      setFormStatus({
        type: 'error',
        message: `Failed to upload tour: ${error?.message || 'Please try again.'}`,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-tour">
      <h1>Create New Tour Package</h1>
      <form onSubmit={handleSubmit} aria-busy={isSubmitting} aria-label="Create tour package">
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
          groupOnly
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
        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Package…' : 'Create Package'}
        </button>
      </form>
    </div>
  );
};

export default UploadTourPage;
