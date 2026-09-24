import React, { useMemo } from 'react';
import {
  FaUsers,
  FaSuitcase,
  FaMoneyBillWave,
  FaStar,
  FaChartLine,
  FaCalendarCheck,
} from 'react-icons/fa';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTours } from '../../Context/ToursContext';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import StatCard from '../ui/StatCard';
import StatusState from '../ui/StatusState';
import buildDashboardMetrics from '../../utils/dashboardMetrics';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { tours, loading, error } = useTours();
  const { company } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!company) {
      navigate('/login');
    }
  }, [company, navigate]);

  const stats = useMemo(() => buildDashboardMetrics(tours), [tours]);

  if (loading) return <StatusState status="loading" title="Loading dashboard..." />;
  if (error)
    return (
      <StatusState status="error" title="We couldn't load this dashboard.">
        {error}
      </StatusState>
    );
  if (!stats)
    return (
      <StatusState status="empty" title="No data available yet.">
        Once tours are published, your metrics will appear here.
      </StatusState>
    );

  // Prepare chart data
  const monthlyRevenue = {
    labels: stats.monthlyRevenue.labels,
    datasets: [
      {
        label: 'Monthly Revenue',
        data: stats.monthlyRevenue.data,
        backgroundColor: '#3498db',
        borderColor: '#2980b9',
        borderWidth: 1,
      },
    ],
  };

  const pieData = {
    labels: stats.packageRevenue.map((pkg) => pkg.name),
    datasets: [
      {
        data: stats.packageRevenue.map((pkg) => pkg.revenue),
        backgroundColor: [
          '#2ecc71',
          '#e74c3c',
          '#f1c40f',
          '#3498db',
          '#9b59b6',
          '#f39c12',
          '#1abc9c',
          '#e67e22',
          '#34495e',
          '#95a5a6',
        ],
        borderColor: [
          '#27ae60',
          '#c0392b',
          '#f1c40f',
          '#2980b9',
          '#8e44ad',
          '#e67e22',
          '#16a085',
          '#d35400',
          '#2c3e50',
          '#7f8c8d',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Package Revenue Distribution' },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Revenue across the year' },
    },
  };

  return (
    <div className="dashboard">
      <h1>Dashboard Overview</h1>
      <div className="stats-grid">
        <StatCard label="Active Packages" value={stats.activePackages} icon={<FaSuitcase />} />
        <StatCard
          label="Lifetime Revenue"
          value={`$${stats.lifetimeRevenue.toLocaleString()}`}
          icon={<FaMoneyBillWave />}
          tone="success"
        />
        <StatCard
          label="New Bookings"
          value={stats.newBookings}
          icon={<FaCalendarCheck />}
          tone="warning"
        />
        <StatCard
          label="Average Rating"
          value={`${stats.customerRating}/5.0`}
          icon={<FaStar />}
          tone="danger"
        />
        <StatCard
          label="Total Customers"
          value={stats.totalCustomers}
          icon={<FaUsers />}
          tone="violet"
        />
        <StatCard
          label="Completed Tours"
          value={stats.completedTours}
          icon={<FaChartLine />}
          tone="teal"
        />
      </div>
      <div className="charts-grid">
        <div className="dashboard-card">
          <Bar data={monthlyRevenue} options={barOptions} />
        </div>
        <div className="dashboard-card">
          <Pie data={pieData} options={pieOptions} />
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-card popular-packages">
          <h2>Popular Packages</h2>
          <div className="package-list">
            {stats.popularPackages.map((pkg, idx) => (
              <div key={pkg.name + '-' + idx} className="package-item">
                <div className="package-info">
                  <h3>{pkg.name}</h3>
                  <p>Bookings: {pkg.bookings || 0}</p>
                  <p>Rating: {pkg.rating}/5.0</p>
                  <p>Revenue: ${(pkg.price * (pkg.bookings || 0)).toLocaleString()}</p>
                </div>
                <div className="package-chart">
                  <div
                    className="chart-bar"
                    style={{
                      height: `${((pkg.bookings || 0) / (stats.popularPackages[0]?.bookings || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="dashboard-card recent-feedback">
          <h2>Recent Feedback</h2>
          <div className="feedback-list">
            {stats.recentFeedback.map((feedback, idx) => (
              <div
                key={(feedback._id || feedback.name || 'feedback') + '-' + idx}
                className="feedback-item"
              >
                <div className="feedback-header">
                  <h3>{feedback.name}</h3>
                  <div className="feedback-rating">
                    {'⭐'.repeat(Math.round(feedback.rating || 0))}
                  </div>
                </div>
                <p>{feedback.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
