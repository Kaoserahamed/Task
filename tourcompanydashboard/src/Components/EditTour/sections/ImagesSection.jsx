import API_BASE_URL from '../../../config/api';

// Image upload and preview for the edit-tour form. Stored images arrive as
// paths; newly picked files are previewed through an object URL.
const ImagesSection = ({ tourDetails, handleFileChange, handleRemoveImage }) => (
  <div className="form-section">
    <h2>Images</h2>
    <div className="file-upload">
      <input type="file" multiple onChange={handleFileChange} accept="image/*" />
      <div className="image-preview">
        {tourDetails.images.map((image, index) => (
          <div key={index} className="image-preview-item">
            <img
              src={image instanceof File ? URL.createObjectURL(image) : `${API_BASE_URL}/${image}`}
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
);

export default ImagesSection;
