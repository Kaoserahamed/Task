const bookingsFor = (tour) => (Array.isArray(tour.bookings) ? tour.bookings : []);
const revenueFor = (tour) =>
  bookingsFor(tour).reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

export function buildDashboardMetrics(tours = [], now = new Date()) {
  if (!tours.length) return null;

  const monthlyRevenueData = Array(12).fill(0);
  const allBookings = [];
  const customerEmails = new Set();
  const ratings = [];

  for (const tour of tours) {
    for (const booking of bookingsFor(tour)) {
      allBookings.push(booking);
      if (booking.email) customerEmails.add(booking.email);
      if (booking.bookingDate) {
        const date = new Date(booking.bookingDate);
        if (date.getFullYear() === now.getFullYear()) {
          monthlyRevenueData[date.getMonth()] += booking.totalAmount || 0;
        }
      }
    }
    if (tour.popularity?.rating?.average) ratings.push(tour.popularity.rating.average);
  }

  const packageRevenue = tours.map((tour) => ({
    name: tour.name || tour.title || 'Untitled',
    revenue: revenueFor(tour),
  }));
  const popularPackages = tours
    .map((tour) => ({
      _id: tour._id,
      name: tour.name || tour.title || 'Untitled',
      bookings: bookingsFor(tour).length,
      price: tour.price || 0,
      rating: tour.popularity?.rating?.average || 'N/A',
      revenue: revenueFor(tour),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  return {
    activePackages: tours.filter((tour) => {
      const start = new Date(tour.startDate);
      const end = new Date(tour.endDate);
      return start <= now && end >= now;
    }).length,
    completedTours: tours.filter((tour) => new Date(tour.endDate) < now).length,
    newBookings: allBookings.length,
    totalCustomers: customerEmails.size,
    lifetimeRevenue: allBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0),
    monthlyRevenue: {
      labels: Array.from({ length: 12 }, (_, index) =>
        new Date(0, index).toLocaleString('default', { month: 'short' })
      ),
      data: monthlyRevenueData,
    },
    packageRevenue,
    popularPackages,
    recentFeedback: tours.flatMap((tour) => tour.reviews || []).slice(0, 5),
    customerRating:
      ratings.length > 0
        ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2)
        : 'N/A',
  };
}

export default buildDashboardMetrics;
