import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useSearchFilters } from './useSearchFilters';

const wrapper = ({ children }) => (
  <MemoryRouter initialEntries={['/search?query=hill&priceMax=450&tourType=Beach&sort=highest']}>
    {children}
  </MemoryRouter>
);

const badPriceWrapper = ({ children }) => (
  <MemoryRouter initialEntries={['/search?priceMax=abc']}>{children}</MemoryRouter>
);

describe('useSearchFilters', () => {
  test('hydrates state from URL parameters', () => {
    const { result } = renderHook(() => useSearchFilters({ tours: [] }), { wrapper });

    expect(result.current.searchQuery).toBe('hill');
    expect(result.current.priceRange).toBe(450);
    expect(result.current.selectedTourTypes).toEqual(['Beach']);
    expect(result.current.sortOption).toBe('highest');
  });

  test('resets local filter state', () => {
    const { result } = renderHook(() => useSearchFilters({ tours: [] }), { wrapper });

    act(() => result.current.resetFilters());

    expect(result.current.searchQuery).toBe('');
    expect(result.current.priceRange).toBe(1000);
    expect(result.current.selectedTourTypes).toEqual([]);
    expect(result.current.sortOption).toBe('lowest');
  });

  test('a malformed priceMax in the URL hydrates a usable slider and keeps tours', () => {
    // A shared link could carry `priceMax=abc`; the hook used to seed NaN into
    // the controlled range input and filter the whole catalogue away.
    const tours = [{ _id: 'a', price: 80 }];
    const { result } = renderHook(() => useSearchFilters({ tours }), {
      wrapper: badPriceWrapper,
    });

    expect(Number.isNaN(result.current.priceRange)).toBe(false);
    expect(result.current.priceRange).toBe(1000);
    expect(result.current.filteredTours).toHaveLength(1);
  });

  test('the price slider only ever receives a value it can represent', () => {
    const { result } = renderHook(() => useSearchFilters({ tours: [] }), {
      wrapper: badPriceWrapper,
    });

    act(() => result.current.handlePriceChange({ target: { value: '99999' } }));

    expect(result.current.priceRange).toBe(1000);

    act(() => result.current.handlePriceChange({ target: { value: 'abc' } }));

    expect(result.current.priceRange).toBe(1000);
  });
});
