import { renderHook, act } from '@testing-library/react';
import { useTourForm } from './useTourForm';

const fieldEvent = (name, value) => ({ target: { name, value } });

describe('useTourForm', () => {
  test('normalizes duration values without losing empty input', () => {
    const { result } = renderHook(() => useTourForm());

    act(() => result.current.handleDurationChange(fieldEvent('days', '3')));
    act(() => result.current.handleDurationChange(fieldEvent('nights', '-2')));

    expect(result.current.tourDetails.duration).toEqual({ days: 3, nights: 0 });

    act(() => result.current.handleDurationChange(fieldEvent('days', '')));
    expect(result.current.tourDetails.duration.days).toBe('');
  });

  test('toggles categories, meals, and tour types', () => {
    const { result } = renderHook(() => useTourForm());

    act(() => result.current.handleCategoryChange('Adventure'));
    act(() => result.current.handleMealChange('breakfast'));
    act(() => result.current.handleTourTypeChange('group'));

    expect(result.current.tourDetails.packageCategories).toEqual(['Adventure']);
    expect(result.current.tourDetails.meals.breakfast).toBe(true);
    expect(result.current.tourDetails.tourType.group).toBe(true);

    act(() => result.current.handleCategoryChange('Adventure'));
    expect(result.current.tourDetails.packageCategories).toEqual([]);
  });

  test('updates nested fields and array values without mutating prior state', () => {
    const { result } = renderHook(() => useTourForm());
    const previous = result.current.tourDetails;

    act(() => result.current.handleTransportationChange(fieldEvent('type', 'Bus')));
    act(() => result.current.handleWeatherChange(fieldEvent('city', 'Dhaka')));
    act(() => result.current.handleArrayFieldChange(0, 'includes', 'Breakfast'));
    act(() => result.current.handleDestinationsChange(fieldEvent('name', 'Sylhet'), 0, 'name'));

    expect(result.current.tourDetails.transportation.type).toBe('Bus');
    expect(result.current.tourDetails.weather.city).toBe('Dhaka');
    expect(result.current.tourDetails.includes).toEqual(['Breakfast']);
    expect(result.current.tourDetails.destinations[0].name).toBe('Sylhet');
    expect(previous.includes).toEqual(['']);
  });

  test('adds destinations and images', () => {
    const { result } = renderHook(() => useTourForm());
    const image = new File(['image'], 'tour.jpg', { type: 'image/jpeg' });

    act(() => result.current.addDestination());
    act(() => result.current.handleFileChange({ target: { files: [image] } }));

    expect(result.current.tourDetails.destinations).toHaveLength(2);
    expect(result.current.tourDetails.images).toEqual([image]);

    act(() => result.current.handleRemoveImage(0));
    expect(result.current.tourDetails.images).toEqual([]);
  });
});
