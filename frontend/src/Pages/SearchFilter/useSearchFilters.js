import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { filterAndSortTours, parseSearchFilters } from '../../utils/searchFilters';

export function useSearchFilters({ tours = [], averageRatings = {}, reviewCounts = {} } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = parseSearchFilters(searchParams);
  const [searchQuery, setSearchQuery] = useState(initialFilters.query);
  const [priceRange, setPriceRange] = useState(initialFilters.priceMax);
  const [selectedTourTypes, setSelectedTourTypes] = useState(initialFilters.tourTypes);
  const [selectedDurations, setSelectedDurations] = useState(initialFilters.durations);
  const [selectedStatuses, setSelectedStatuses] = useState(initialFilters.statuses);
  const [sortOption, setSortOption] = useState(initialFilters.sort);

  const updateURLParams = useCallback(
    (param, value, isArray = false) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete(param);
      if (isArray) {
        if (Array.isArray(value))
          value.filter(Boolean).forEach((item) => newParams.append(param, item));
      } else if (value) {
        newParams.set(param, value);
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handleSearch = (query) => {
    setSearchQuery(query);
    updateURLParams('query', query);
  };

  const handlePriceChange = (event) => {
    const value = Number.parseInt(event.target.value, 10);
    setPriceRange(value);
    updateURLParams('priceMax', value.toString());
  };

  const handleTourTypeChange = (type) => {
    setSelectedTourTypes((current) => {
      const updated = current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type];
      updateURLParams('tourType', updated, true);
      return updated;
    });
  };

  const handleDurationChange = (duration) => {
    setSelectedDurations((current) => {
      const updated = current.includes(duration)
        ? current.filter((item) => item !== duration)
        : [...current, duration];
      updateURLParams('duration', updated, true);
      return updated;
    });
  };

  const handleStatusChange = (status) => {
    setSelectedStatuses((current) => {
      const updated = current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status];
      updateURLParams('status', updated, true);
      return updated;
    });
  };

  const handleSortChange = (event) => {
    const value = event.target.value;
    setSortOption(value);
    updateURLParams('sort', value);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setPriceRange(1000);
    setSelectedTourTypes([]);
    setSelectedDurations([]);
    setSelectedStatuses([]);
    setSortOption('lowest');
    setSearchParams({});
  };

  const filteredTours = useMemo(
    () =>
      filterAndSortTours({
        tours,
        query: searchQuery,
        priceMax: priceRange,
        tourTypes: selectedTourTypes,
        durations: selectedDurations,
        statuses: selectedStatuses,
        sort: sortOption,
        averageRatings,
        reviewCounts,
      }),
    [
      tours,
      searchQuery,
      priceRange,
      selectedTourTypes,
      selectedDurations,
      selectedStatuses,
      sortOption,
      averageRatings,
      reviewCounts,
    ]
  );

  return {
    searchQuery,
    priceRange,
    selectedTourTypes,
    selectedDurations,
    selectedStatuses,
    sortOption,
    filteredTours,
    handleSearch,
    handlePriceChange,
    handleTourTypeChange,
    handleDurationChange,
    handleStatusChange,
    handleSortChange,
    resetFilters,
  };
}
