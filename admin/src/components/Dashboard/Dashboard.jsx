import React from 'react';
import './Dashboard.css';
import StatCard from '../ui/StatCard';
import StatusState from '../ui/StatusState';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../hooks/useDashboardData';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    loading,
    error,
    retry,
    totalRevenue,
    upcomingTrips,
    finishedTrips,
    monthlyRevenue,
    topCompanies,
    pendingCompanies,
    approvedCompanies,
    pendingPackages,
  } = useDashboardData();

  if (loading) {
    return <StatusState status="loading" title="Loading admin dashboard..." />;
  }

  if (error) {
    return (
      <StatusState status="error" title="We couldn't load the admin dashboard.">
        <p>{error}</p>
        <button className="status-state__action" type="button" onClick={retry}>
          Try again
        </button>
      </StatusState>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <div className="date-time">
          <p>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="analytics-overview">
        <StatCard
          label="Active Packages"
          value={upcomingTrips}
          icon={<i className="fas fa-calendar-check" />}
          tone="primary"
          trend={{ label: 'Live inventory', tone: 'positive' }}
        />
        <StatCard
          label="Companies"
          value={approvedCompanies.length}
          icon={<i className="fas fa-users" />}
          tone="success"
          trend={{ label: 'Approved accounts', tone: 'positive' }}
        />
        <StatCard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={<i className="fas fa-dollar-sign" />}
          tone="info"
          trend={{ label: 'Recorded revenue', tone: 'positive' }}
        />
        <StatCard
          label="Finished Trips"
          value={finishedTrips}
          icon={<i className="fas fa-flag-checkered" />}
          tone="warning"
          trend={{ label: 'Completed tours', tone: 'positive' }}
        />
      </div>

      <div className="dashboard-content">
        {/* New Companies Section - Modern Card UI */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>
              <i className="fas fa-building"></i> New Companies
            </h3>
            {/* <button className="view-all-btn">View All</button> */}
          </div>
          <div className="modern-card-list">
            {pendingCompanies.map((company) => (
              <div key={company._id} className="modern-card company-modern-card">
                <div className="modern-card-avatar">
                  <img
                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${company.name}`}
                    alt={company.name}
                  />
                </div>
                <div className="modern-card-info">
                  <h4>{company.name}</h4>
                  <p className="modern-card-email">{company.email}</p>
                  <p className="modern-card-phone">{company.phone}</p>
                  <p className="modern-card-address">{company.address}</p>
                </div>
                <div className="modern-card-actions">
                  <button
                    className="modern-btn view"
                    onClick={() => navigate(`/admin/registration-request/${company._id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
            {pendingCompanies.length === 0 && (
              <div style={{ padding: '1rem', color: '#888' }}>
                No pending registration requests.
              </div>
            )}
          </div>
        </div>
        {/* New Packages Section - Modern Card UI */}
        <div className="dashboard-section" style={{ marginTop: 0 }}>
          <div className="section-header">
            <h3>
              <i className="fas fa-box"></i> New Packages Waiting For Approval
            </h3>
          </div>
          <div className="modern-card-list">
            {pendingPackages.map((pkg) => (
              <div key={pkg._id} className="modern-card package-modern-card">
                <div className="modern-card-info">
                  <h4>{pkg.name}</h4>
                  <p className="modern-card-company">Company: {pkg.companyName || 'Unknown'}</p>
                  <p className="modern-card-dates">
                    {pkg.startDate ? `Start: ${new Date(pkg.startDate).toLocaleDateString()}` : ''}
                    {pkg.endDate ? ` | End: ${new Date(pkg.endDate).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <div className="modern-card-actions">
                  <button
                    className="modern-btn view"
                    onClick={() => navigate(`/admin/package-details/${pkg._id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
            {pendingPackages.length === 0 && (
              <div style={{ padding: '1rem', color: '#888' }}>No pending packages.</div>
            )}
          </div>
        </div>
        {/* Revenue Bar Chart Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>
              <i className="fas fa-chart-bar"></i> Platform Revenue by Booking Month
            </h3>
          </div>
          <Bar
            data={{
              labels: monthlyRevenue.labels,
              datasets: [
                {
                  label: 'Revenue (USD)',
                  data: monthlyRevenue.data,
                  backgroundColor: 'rgba(54, 162, 235, 0.6)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        </div>
        {/* Top Companies Pie Chart Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>
              <i className="fas fa-chart-pie"></i> Top 10 Companies by Recorded Revenue
            </h3>
          </div>
          <Pie
            data={{
              labels: topCompanies.map((company) => company.name),
              datasets: [
                {
                  data: topCompanies.map((company) => company.revenue),
                  backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40',
                    '#C9CBCF',
                    '#FF6384AA',
                    '#36A2EBAA',
                    '#FFCE56AA',
                  ],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'right' },
                title: { display: false },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
