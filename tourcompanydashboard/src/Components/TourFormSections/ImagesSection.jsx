import { useEffect, useState } from 'react';
import API_BASE_URL from '../../config/api';
import { MAX_TOUR_IMAGES } from '../../utils/tourImages';

const ImagePreview = ({ image, index, onRemove }) => {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!(image instanceof File)) {
      setPreviewUrl(`${API_BASE_URL}/${image}`);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  return (
    <div className="image-preview-item">
      <img src={previewUrl} alt={`preview-${index}`} className="image-thumbnail" />
      <button type="button" onClick={onRemove} className="remove-image-button">
        Remove
      </button>
    </div>
  );
};

const ImagesSection = ({
  tourDetails,
  handleFileChange,
  handleRemoveImage,
  imageError = '',
  clearImageError = () => {},
}) => (
  <div className="form-section">
    <h2>Images</h2>
    <div className="file-upload">
      <label htmlFor="tour-images">Tour images</label>
      <input
        id="tour-images"
        type="file"
        multiple
        onChange={handleFileChange}
        onBlur={clearImageError}
        accept="image/jpeg,image/png,image/gif,image/webp"
        aria-describedby="tour-images-help"
        aria-invalid={Boolean(imageError)}
      />
      <p id="tour-images-help" className="upload-help">
        Up to {MAX_TOUR_IMAGES} images; each must be 5 MB or smaller.
      </p>
      {imageError && (
        <p className="form-status form-status--error" role="alert">
          {imageError}
        </p>
      )}
      <div className="image-preview">
        {tourDetails.images.map((image, index) => (
          <ImagePreview
            key={`${image.name || image}-${image.size || 0}-${index}`}
            image={image}
            index={index}
            onRemove={() => handleRemoveImage(index)}
          />
        ))}
      </div>
    </div>
  </div>
);

export { MAX_TOUR_IMAGES };
export default ImagesSection;
