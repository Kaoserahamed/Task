// Weather fields shared by the tour forms.
const WeatherSection = ({ tourDetails, weatherConditions, handleWeatherChange }) => (
  <div className="form-section">
    <h2>Weather Information</h2>
    <div className="weather-section">
      <input
        type="text"
        name="city"
        placeholder="Weather City/Location"
        value={tourDetails.weather?.city || ''}
        onChange={handleWeatherChange}
      />
      <select
        name="condition"
        value={tourDetails.weather?.condition || ''}
        onChange={handleWeatherChange}
      >
        <option value="">Select Weather Condition</option>
        {weatherConditions.map((condition) => (
          <option key={condition} value={condition}>
            {condition}
          </option>
        ))}
      </select>
      <input
        type="number"
        name="temp"
        placeholder="Average Temperature (°C)"
        value={tourDetails.weather?.temp || ''}
        onChange={handleWeatherChange}
        step="0.1"
      />
    </div>
  </div>
);

export default WeatherSection;
