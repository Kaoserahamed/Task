// Basic-information fields shared by the create and edit tour forms. State
// stays in useTourForm; this component only renders fields and forwards events.
const BasicInfoSection = ({
  tourDetails,
  packageCategories,
  handleChange,
  handleDurationChange,
  handleCategoryChange,
  handleTourTypeChange,
  groupOnly = false,
}) => (
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
        {groupOnly ? (
          <label>
            <input type="checkbox" checked disabled readOnly />
            Group
          </label>
        ) : (
          <>
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
          </>
        )}
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

    {(groupOnly || tourDetails.tourType.group) && (
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
          min={groupOnly ? '1' : '0'}
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
);

export default BasicInfoSection;
