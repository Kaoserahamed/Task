import buildDashboardMetrics from './dashboardMetrics';

const now = new Date('2026-07-15T12:00:00Z');

describe('buildDashboardMetrics', () => {
  test('returns null for an empty tour set', () => {
    expect(buildDashboardMetrics([], now)).toBeNull();
  });

  test('aggregates bookings, customers, revenue, ratings, and package metrics', () => {
    const tours = [
      {
        _id: 'tour-1',
        name: 'Hill Trip',
        startDate: '2026-07-10',
        endDate: '2026-07-20',
        price: 100,
        bookings: [
          { email: 'one@example.test', bookingDate: '2026-07-01', totalAmount: 100 },
          { email: 'two@example.test', bookingDate: '2026-08-01', totalAmount: 200 },
        ],
        popularity: { rating: { average: 4.5 } },
        reviews: [{ _id: 'review-1', comment: 'Great' }],
      },
      {
        _id: 'tour-2',
        name: 'Old Trip',
        startDate: '2026-06-01',
        endDate: '2026-06-10',
        bookings: [],
      },
    ];

    const metrics = buildDashboardMetrics(tours, now);

    expect(metrics).toMatchObject({
      activePackages: 1,
      completedTours: 1,
      newBookings: 2,
      totalCustomers: 2,
      lifetimeRevenue: 300,
      customerRating: '4.50',
    });
    expect(metrics.monthlyRevenue.data[6]).toBe(100);
    expect(metrics.monthlyRevenue.data[7]).toBe(200);
    expect(metrics.popularPackages[0]).toMatchObject({
      name: 'Hill Trip',
      revenue: 300,
      bookings: 2,
    });
    expect(metrics.recentFeedback).toHaveLength(1);
  });
});
