// Meals, transportation and tour-guide options. Mirrors the services block of
// the old single-file form; state stays in useTourForm.
const ServicesSection = ({
  tourDetails,
  transportationTypes,
  handleMealChange,
  handleTransportationChange,
  setTourDetails,
}) => (
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
          onChange={(event) =>
            setTourDetails({
              ...tourDetails,
              tourGuide: event.target.checked,
            })
          }
        />
        Tour Guide Available
      </label>
    </div>
  </div>
);

export default ServicesSection;
