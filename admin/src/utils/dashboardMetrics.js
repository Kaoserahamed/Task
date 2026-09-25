const PLATFORM_REVENUE_RATE = 0.1;

const MONTH_LABELS = Array.from({ length: 12 }, (_, month) =>
  new Date(0, month).toLocaleString('default', { month: 'short' })
);

const asAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const asValidDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const bookingAmount = (booking) => asAmount(booking?.totalAmount) * PLATFORM_REVENUE_RATE;

/** Build all calculated values rendered by the admin dashboard. */
export function buildAdminDashboardMetrics(
  tours = [],
  bookings = [],
  companies = [],
  now = new Date()
) {
  const safeTours = Array.isArray(tours) ? tours : [];
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeCompanies = Array.isArray(companies) ? companies : [];
  const monthlyRevenue = Array(12).fill(0);
  let totalRevenue = 0;

  for (const booking of safeBookings) {
    const revenue = bookingAmount(booking);
    totalRevenue += revenue;
    const createdAt = asValidDate(booking?.createdAt);
    if (revenue > 0 && createdAt) monthlyRevenue[createdAt.getMonth()] += revenue;
  }

  const tourCompany = new Map(
    safeTours
      .filter((tour) => tour?._id && tour?.companyId)
      .map((tour) => [String(tour._id), String(tour.companyId)])
  );
  const companyNames = new Map(
    safeCompanies
      .filter((company) => company?._id && company?.name)
      .map((company) => [String(company._id), company.name])
  );
  const revenueByCompany = new Map();

  for (const booking of safeBookings) {
    const revenue = bookingAmount(booking);
    const companyId = booking?.tourId ? tourCompany.get(String(booking.tourId)) : null;
    if (revenue <= 0 || !companyId) continue;
    revenueByCompany.set(companyId, (revenueByCompany.get(companyId) || 0) + revenue);
  }

  const topCompanies = [...revenueByCompany.entries()]
    .sort(([leftId, leftRevenue], [rightId, rightRevenue]) =>
      rightRevenue === leftRevenue ? leftId.localeCompare(rightId) : rightRevenue - leftRevenue
    )
    .slice(0, 10)
    .map(([companyId, revenue]) => ({
      companyId,
      name: companyNames.get(companyId) || 'Unknown',
      revenue,
    }));

  const approvedTours = safeTours.filter((tour) => tour?.status === 'approved');
  const upcomingTrips = approvedTours.filter((tour) => {
    const start = asValidDate(tour?.startDate);
    const end = asValidDate(tour?.endDate);
    return start && end && end > now;
  }).length;
  const finishedTrips = approvedTours.filter((tour) => {
    const start = asValidDate(tour?.startDate);
    const end = asValidDate(tour?.endDate);
    return start && end && end < now;
  }).length;

  return {
    totalBookings: safeBookings.length,
    totalRevenue: Math.round(totalRevenue),
    upcomingTrips,
    finishedTrips,
    monthlyRevenue: { labels: MONTH_LABELS, data: monthlyRevenue },
    topCompanies,
  };
}

export { PLATFORM_REVENUE_RATE };
export default buildAdminDashboardMetrics;
