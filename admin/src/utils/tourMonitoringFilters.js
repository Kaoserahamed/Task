const asDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const matchesSearch = (tour, searchTerm) => {
  if (!searchTerm) return true;
  const query = searchTerm.trim().toLowerCase();
  if (!query) return true;
  const name = String(tour?.name || '').toLowerCase();
  const destinations = Array.isArray(tour?.destinations)
    ? tour.destinations
        .map((destination) => String(destination?.name || '').toLowerCase())
        .join(' ')
    : '';
  return name.includes(query) || destinations.includes(query);
};

export const filterMonitoringTours = (
  tours = [],
  { tab = 'all', searchTerm = '', now = new Date() } = {}
) => {
  if (!Array.isArray(tours)) return [];
  const current = asDate(now) || new Date();

  return tours.filter((tour) => {
    if (tab === 'approved' || tab === 'pending' || tab === 'rejected') {
      if (tour?.status !== tab) return false;
    } else if (tab === 'upcoming') {
      const start = asDate(tour?.startDate);
      if (tour?.status !== 'approved' || !start || start <= current) return false;
    } else if (tab === 'finished') {
      const end = asDate(tour?.endDate);
      if (tour?.status !== 'approved' || !end || end >= current) return false;
    } else if (tab !== 'all') {
      return false;
    }

    return matchesSearch(tour, searchTerm);
  });
};

export default filterMonitoringTours;
