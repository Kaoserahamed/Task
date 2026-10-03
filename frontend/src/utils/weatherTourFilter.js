// Weather-based tour matching, extracted from the WeatherSuggestion component
// so the rules are unit-testable without rendering the view and without the
// development-only debug logging that used to sit in the filter body.
//
// A tour is recommended when its city matches the searched city exactly after
// normalisation AND at least one weather attribute agrees: a similar condition
// or a temperature within the tolerance.

/** Lower-cased, trimmed city name; the comparison key for every city match. */
export const normalizeCity = (cityName) => {
  if (!cityName) return '';
  return String(cityName).toLowerCase().trim();
};

/** Temperature tolerance in degrees between the searched city and a tour. */
export const TEMPERATURE_TOLERANCE = 10;

const CONDITION_VARIANTS = {
  Clear: ['Sunny', 'Clear', 'Hot'],
  Sunny: ['Clear', 'Sunny', 'Hot'],
  Clouds: ['Cloudy', 'Clouds', 'Partly Cloudy'],
  Cloudy: ['Clouds', 'Cloudy', 'Partly Cloudy'],
  Rain: ['Rainy', 'Rain', 'Drizzle'],
  Rainy: ['Rain', 'Rainy', 'Drizzle'],
  Snow: ['Snowy', 'Snow', 'Cold'],
  Thunderstorm: ['Stormy', 'Thunderstorm'],
};

const conditionGroup = (condition) => CONDITION_VARIANTS[condition] || [condition];

/** True when two conditions describe the same kind of weather. */
export const isWeatherSimilar = (condition1, condition2) => {
  if (!condition1 || !condition2) return false;
  const left = conditionGroup(condition1);
  const right = conditionGroup(condition2);
  return left.some((value) => right.includes(value)) || right.some((value) => left.includes(value));
};

const isTemperatureSimilar = (temp1, temp2, tolerance = TEMPERATURE_TOLERANCE) =>
  Math.abs(temp1 - temp2) <= tolerance;

const isPresent = (value) => value !== null && value !== undefined;

/**
 * Tours whose weather suits `weatherData`, best match first.
 *
 * Ordering is by absolute temperature difference, then by an exact condition
 * match, so the closest tour leads the list. Returns `[]` for missing weather
 * data or an empty tour list. The input array is never mutated.
 */
export const filterToursByWeather = (tours = [], weatherData = {}) => {
  if (!Array.isArray(tours) || !weatherData || !tours.length) return [];

  const currentTemp = weatherData.temp ?? weatherData.temperature;
  const currentCondition = weatherData.condition ?? weatherData.main;
  const currentCity = normalizeCity(weatherData.city);
  if (!currentCity) return [];

  return tours
    .filter((tour) => {
      if (!tour?.weather?.city) return false;
      if (normalizeCity(tour.weather.city) !== currentCity) return false;

      const conditionMatch =
        isPresent(tour.weather.condition) && isPresent(currentCondition)
          ? isWeatherSimilar(currentCondition, tour.weather.condition)
          : false;
      const tempMatch =
        isPresent(tour.weather.temp) && isPresent(currentTemp)
          ? isTemperatureSimilar(currentTemp, tour.weather.temp)
          : false;

      return conditionMatch || tempMatch;
    })
    .sort((a, b) => {
      const difference = (tour) =>
        isPresent(currentTemp) && isPresent(tour.weather?.temp)
          ? Math.abs(currentTemp - tour.weather.temp)
          : Number.MAX_SAFE_INTEGER;

      const byTemperature = difference(a) - difference(b);
      if (byTemperature !== 0) return byTemperature;

      const exact = (tour) => (tour.weather?.condition === currentCondition ? 0 : 1);
      return exact(a) - exact(b);
    });
};

export default filterToursByWeather;
