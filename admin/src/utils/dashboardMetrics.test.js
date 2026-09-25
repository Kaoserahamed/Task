import buildAdminDashboardMetrics, { PLATFORM_REVENUE_RATE } from './dashboardMetrics';

const now = new Date('2026-07-15T12:00:00Z');

describe('buildAdminDashboardMetrics', () => {
  test('returns safe empty metrics for missing resources', () => {
    expect(buildAdminDashboardMetrics(null, null, null, now)).toEqual({
      totalBookings: 0,
      totalRevenue: 0,
      upcomingTrips: 0,
      finishedTrips: 0,
      monthlyRevenue: {
        labels: expect.arrayContaining(['Jan', 'Dec']),
        data: Array(12).fill(0),
      },
      topCompanies: [],
    });
  });

  test('calculates trips, platform revenue, monthly totals, and company ranking', () => {
    const tours = [
      {
        _id: 'tour-1',
        companyId: 'company-1',
        status: 'approved',
        startDate: '2026-07-01',
        endDate: '2026-08-01',
      },
      {
        _id: 'tour-2',
        companyId: 'company-2',
        status: 'approved',
        startDate: '2026-06-01',
        endDate: '2026-07-01',
      },
      { _id: 'tour-3', companyId: 'company-2', status: 'pending', endDate: '2026-08-01' },
    ];
    const bookings = [
      { tourId: 'tour-1', totalAmount: 500, createdAt: '2026-07-10T12:00:00Z' },
      { tourId: 'tour-2', totalAmount: 200, createdAt: '2026-08-10T12:00:00Z' },
      { tourId: 'tour-3', totalAmount: 900, createdAt: 'invalid' },
    ];
    const companies = [
      { _id: 'company-1', name: 'Alpha Tours' },
      { _id: 'company-2', name: 'Beta Tours' },
    ];

    const metrics = buildAdminDashboardMetrics(tours, bookings, companies, now);

    expect(PLATFORM_REVENUE_RATE).toBe(0.1);
    expect(metrics).toMatchObject({
      totalBookings: 3,
      totalRevenue: 160,
      upcomingTrips: 1,
      finishedTrips: 1,
      topCompanies: [
        { companyId: 'company-2', name: 'Beta Tours', revenue: 110 },
        { companyId: 'company-1', name: 'Alpha Tours', revenue: 50 },
      ],
    });
    expect(metrics.monthlyRevenue.data[6]).toBe(50);
    expect(metrics.monthlyRevenue.data[7]).toBe(20);
  });

  test('ignores invalid amounts and ranks equal revenue by stable company id', () => {
    const metrics = buildAdminDashboardMetrics(
      [
        { _id: 'tour-b', companyId: 'company-b' },
        { _id: 'tour-a', companyId: 'company-a' },
      ],
      [
        { tourId: 'tour-b', totalAmount: 100 },
        { tourId: 'tour-a', totalAmount: 100 },
        { tourId: 'tour-b', totalAmount: 'bad' },
        { tourId: 'missing', totalAmount: 500 },
      ],
      [
        { _id: 'company-b', name: 'Beta' },
        { _id: 'company-a', name: 'Alpha' },
      ],
      now
    );

    expect(metrics.totalRevenue).toBe(70);
    expect(metrics.topCompanies.map((company) => company.companyId)).toEqual([
      'company-a',
      'company-b',
    ]);
  });
});
