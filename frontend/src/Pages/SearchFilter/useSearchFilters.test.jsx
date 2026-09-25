import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useSearchFilters } from './useSearchFilters';

const wrapper = ({ children }) => (
  <MemoryRouter initialEntries={['/search?query=hill&priceMax=450&tourType=Beach&sort=highest']}>
    {children}
  </MemoryRouter>
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
});
