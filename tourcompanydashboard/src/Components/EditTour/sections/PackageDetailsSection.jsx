// Includes, excludes, notes and price for the edit-tour form.
const PackageDetailsSection = ({
  tourDetails,
  handleChange,
  handleArrayFieldChange,
  addArrayField,
}) => (
  <div className="form-section">
    <h2>Package Details</h2>
    <div className="includes-section">
      {tourDetails.includes.map((item, index) => (
        <input
          key={index}
          type="text"
          placeholder="What's Included?"
          value={item}
          onChange={(event) => handleArrayFieldChange(index, 'includes', event.target.value)}
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
          onChange={(event) => handleArrayFieldChange(index, 'excludes', event.target.value)}
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
);

export default PackageDetailsSection;
