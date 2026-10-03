import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WeatherSuggestion from './WeatherSuggestion';
import { ToursContext } from '../../Context/ToursContext';
import * as weatherApi from '../../api/weather';
import * as toursApi from '../../api/tours';
import {
  filterToursByWeather,
  isWeatherSimilar,
  normalizeCity,
} from '../../utils/weatherTourFilter';

jest.mock('../../api/weather', () => ({ fetchWeather: jest.fn() }));
jest.mock('../../api/tours', () => ({ incrementTourView: jest.fn() }));

const tour = (id, weather, name) => ({ _id: id, name, weather });

// Fixed fixture. Tolerance is 10 degrees, so "near" (26) and "rainy" (22) match
// the 25-degree search on temperature, while "sunny" (60) is 35 degrees out and
// is included only because "Sunny" is a documented synonym of "Clear". The
// Sylhet tour and the weather-less tour must never appear in a Dhaka result.
const TOURS = [
  tour('near', { city: 'Dhaka', condition: 'Clear', temp: 26 }, 'Dhaka near'),
  tour('rain', { city: 'Dhaka', condition: 'Rain', temp: 22 }, 'Dhaka rainy'),
  tour('sun', { city: 'Dhaka', condition: 'Sunny', temp: 60 }, 'Dhaka sunny'),
  tour('other-city', { city: 'Sylhet', condition: 'Clear', temp: 26 }, 'Sylhet getaway'),
  tour('no-weather', undefined, 'No weather'),
];

const DHAKA = { city: 'Dhaka', condition: 'Clear', temp: 25 };
const names = (tours) => tours.map((item) => item.name);

describe('filterToursByWeather', () => {
  test('keeps only same-city tours, closest temperature first', () => {
    expect(names(filterToursByWeather(TOURS, DHAKA))).toEqual([
      'Dhaka near',
      'Dhaka rainy',
      'Dhaka sunny',
    ]);
  });

  test('excludes other cities and tours without weather data', () => {
    const result = names(filterToursByWeather(TOURS, DHAKA));

    expect(result).not.toContain('Sylhet getaway');
    expect(result).not.toContain('No weather');
  });

  test('includes a tour matched only by a synonymous condition, outside the tolerance', () => {
    // 60 degrees is 35 away from 25, so only "Sunny" ~ "Clear" can admit it.
    expect(names(filterToursByWeather(TOURS, DHAKA))).toContain('Dhaka sunny');
  });

  test('accepts the OpenWeather-style temperature and condition field names', () => {
    const result = names(
      filterToursByWeather(TOURS, { city: 'Dhaka', main: 'Rain', temperature: 22 })
    );

    expect(result).toEqual(['Dhaka rainy', 'Dhaka near']);
  });

  test('returns an empty array when neither the city, condition nor temperature agrees', () => {
    expect(filterToursByWeather(TOURS, { city: 'Khulna', condition: 'Clear', temp: 25 })).toEqual(
      []
    );
    expect(filterToursByWeather(TOURS, { city: 'Sylhet', condition: 'Snow', temp: 5 })).toEqual([]);
  });

  test('tolerates missing weather data, an empty list, and unusable input', () => {
    expect(filterToursByWeather(TOURS, null)).toEqual([]);
    expect(filterToursByWeather([], DHAKA)).toEqual([]);
    expect(filterToursByWeather(null, DHAKA)).toEqual([]);
    expect(filterToursByWeather('nope', DHAKA)).toEqual([]);
    expect(filterToursByWeather(TOURS, {})).toEqual([]);
  });

  test('does not mutate the tours array it was given', () => {
    const original = [...TOURS];
    filterToursByWeather(TOURS, DHAKA);

    expect(TOURS).toEqual(original);
  });
});

describe('normalizeCity', () => {
  test('lower-cases and trims, and maps nothing to an empty string', () => {
    expect(normalizeCity('  Dhaka ')).toBe('dhaka');
    expect(normalizeCity("Cox's Bazar")).toBe("cox's bazar");
    expect(normalizeCity(null)).toBe('');
    expect(normalizeCity(undefined)).toBe('');
  });
});

describe('isWeatherSimilar', () => {
  test('treats documented synonyms as the same weather', () => {
    expect(isWeatherSimilar('Clear', 'Sunny')).toBe(true);
    expect(isWeatherSimilar('Rain', 'Drizzle')).toBe(true);
    expect(isWeatherSimilar('Clouds', 'Partly Cloudy')).toBe(true);
  });

  test('separates unrelated conditions and rejects missing ones', () => {
    expect(isWeatherSimilar('Clear', 'Thunderstorm')).toBe(false);
    expect(isWeatherSimilar('Clear', null)).toBe(false);
  });
});

describe('WeatherSuggestion', () => {
  const renderWithTours = (tours = TOURS, loading = false) =>
    render(
      <MemoryRouter>
        <ToursContext.Provider value={{ tours, loading }}>
          <WeatherSuggestion />
        </ToursContext.Provider>
      </MemoryRouter>
    );

  const searchFor = (city) => {
    fireEvent.change(screen.getByPlaceholderText(/Enter city name/), { target: { value: city } });
    fireEvent.click(screen.getByRole('button', { name: /🔍|⏳/ }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    toursApi.incrementTourView.mockResolvedValue({ success: true });
  });

  test('shows the welcome state before a search', () => {
    renderWithTours();

    expect(screen.getByText(/Welcome to Weather-Based Tour Discovery/)).toBeInTheDocument();
  });

  test('renders only the recommended tours for the searched city', async () => {
    weatherApi.fetchWeather.mockResolvedValue({ city: 'Dhaka', weather: 'Clear', temp: 25 });
    renderWithTours();

    searchFor('Dhaka');

    await waitFor(() => expect(weatherApi.fetchWeather).toHaveBeenCalledWith('Dhaka'));
    expect(await screen.findByText('Dhaka near')).toBeInTheDocument();
    expect(screen.getByText('Dhaka sunny')).toBeInTheDocument();
    // The Sylhet tour and the weather-less tour are not recommended for Dhaka.
    expect(screen.queryByText('Sylhet getaway')).not.toBeInTheDocument();
    expect(screen.queryByText('No weather')).not.toBeInTheDocument();
  });

  test('selects a popular city without typing it', async () => {
    weatherApi.fetchWeather.mockResolvedValue({ city: 'Sylhet', weather: 'Clear', temp: 26 });
    renderWithTours();

    fireEvent.click(screen.getByRole('button', { name: 'Sylhet' }));

    await waitFor(() => expect(weatherApi.fetchWeather).toHaveBeenCalledWith('Sylhet'));
    expect(await screen.findByText('Sylhet getaway')).toBeInTheDocument();
    expect(screen.queryByText('Dhaka near')).not.toBeInTheDocument();
  });

  test('rejects a city that is not on the supported list without calling the API', async () => {
    renderWithTours();

    searchFor('Paris');

    expect(await screen.findByText(/Paris is not a valid city in our list/)).toBeInTheDocument();
    expect(weatherApi.fetchWeather).not.toHaveBeenCalled();
  });

  test('surfaces a readable message when the weather lookup fails', async () => {
    weatherApi.fetchWeather.mockRejectedValue(new Error('upstream down'));
    renderWithTours();

    searchFor('Dhaka');

    expect(await screen.findByText(/Could not fetch weather data for Dhaka/)).toBeInTheDocument();
  });
});
