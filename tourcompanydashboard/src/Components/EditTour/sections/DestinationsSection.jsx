// Repeatable destination rows for the edit-tour form.
const DestinationsSection = ({ tourDetails, handleDestinationsChange, addDestination }) => (
  <div className="form-section">
    <h2>Destinations</h2>
    {tourDetails.destinations.map((destination, index) => (
      <div key={index} className="destination-input">
        <input
          type="text"
          placeholder="Destination Name"
          value={destination.name}
          onChange={(event) => handleDestinationsChange(event, index, 'name')}
          required
        />
        <textarea
          placeholder="Destination Description"
          value={destination.description}
          onChange={(event) => handleDestinationsChange(event, index, 'description')}
          required
        />
        <input
          type="text"
          placeholder="Stay Duration (e.g., 2 days)"
          value={destination.stayDuration}
          onChange={(event) => handleDestinationsChange(event, index, 'stayDuration')}
          required
        />
      </div>
    ))}
    <button type="button" onClick={addDestination}>
      Add Destination
    </button>
  </div>
);

export default DestinationsSection;
