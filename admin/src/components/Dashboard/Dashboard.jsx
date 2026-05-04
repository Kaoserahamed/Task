import React from 'react';
import './Dashboard.css';
import { useState, useEffect } from 'react';
import Pendingtours from './PendingTours';
import socket from '../../socket'
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);


const Dashboard = () => {
  const [pendingtours, setPendingtours] = useState([]);
  const [tours, setTours] = useState([]);
  const [bookingsData, setBookingsData] = useState({ totalBookings: 0, totalRevenue: 0 });
  const [runningTrips, setRunningTrips] = useState(0);
  const [revenueByMonth, setRevenueByMonth] = useState(Array(12).fill(0));
  const [topCompanies, setTopCompanies] = useState([]);
  const [companyMap, setCompanyMap] = useState({});
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [upcomingTrips, setUpcomingTrips] = useState(0);
  const [finishedTrips, setFinishedTrips] = useState(0);
  const [barLabels, setBarLabels] = useState(["Jan"]);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [approvedCompanies, setApprovedCompanies] = useState([]);
  const [pendingPackages, setPendingPackages] = useState([]);
  const navigate = useNavigate();
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin-token'));

  useEffect(() => {
    async function fetchDashboardData() {
      // Fetch all tours
      const toursRes = await fetch('https://backend-eight-tan-16.vercel.app/api/tours');
      const toursData = await toursRes.json();
      const tours = toursData.tours || [];
      setTours(tours);
      // Fetch all bookings
      const bookingsRes = await fetch('https://backend-eight-tan-16.vercel.app/api/bookings/all');
      const bookingsData = await bookingsRes.json();
      const allBookings = bookingsData.bookings || [];
      // Calculate total revenue
      const totalRevenue = allBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0) * 0.1;
      setBookingsData((prev) => ({ ...prev, totalRevenue: Math.round(totalRevenue) }));
      // Calculate upcoming and finished trips
      const today = new Date();
      let upcoming = 0;
      let finished = 0;
      tours.forEach(tour => {
        if (tour.status !== 'approved' || !tour.startDate || !tour.endDate) return;
        const start = new Date(tour.startDate);
        const end = new Date(tour.endDate);
        if (end > today) upcoming++;
        if (end < today) finished++;
      });
      setUpcomingTrips(upcoming);
      setFinishedTrips(finished);
    }
    fetchDashboardData();
  }, []);

  useEffect(() => {
    async function fetchChartData() {
      setLoadingCharts(true);
      // Fetch all bookings
      const bookingsRes = await fetch('https://backend-eight-tan-16.vercel.app/api/bookings/all');
      const bookingsData = await bookingsRes.json();
      const allBookings = bookingsData.bookings || [];
      // Bar chart: revenue by month (Jan-Dec)
      const monthlyRevenue = Array(12).fill(0);
      allBookings.forEach(b => {
        if (!b.createdAt || !b.totalAmount) return;
        const d = new Date(b.createdAt);
        const monthIdx = d.getMonth(); // 0 = Jan, 11 = Dec
        monthlyRevenue[monthIdx] += b.totalAmount * 0.1;
      });
      setRevenueByMonth(monthlyRevenue);
      setBarLabels([
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ]);
      // Fetch all tours
      const toursRes = await fetch('https://backend-eight-tan-16.vercel.app/api/tours');
      const toursData = await toursRes.json();
      const tours = toursData.tours || [];
      // Fetch all companies
      const companiesRes = await fetch('https://backend-eight-tan-16.vercel.app/company/auth/companies');
      const companiesData = await companiesRes.json();
      const companies = companiesData.companies || [];
      // Build maps for fast lookup
      const tourIdToCompanyId = {};
      const companyIdToName = {};
      tours.forEach(t => { if (t._id && t.companyId) tourIdToCompanyId[t._id] = t.companyId; });
      companies.forEach(c => { if (c._id && c.name) companyIdToName[c._id] = c.name; });
      setCompanyMap(companyIdToName);
      // Calculate revenue per company
      const companyRevenue = {};
      allBookings.forEach(b => {
        if (!b.tourId || !b.totalAmount) return;
        const companyId = tourIdToCompanyId[b.tourId];
        if (!companyId) return;
        companyRevenue[companyId] = (companyRevenue[companyId] || 0) + b.totalAmount * 0.1;
      });
      // Sort and get top 10
      const sortedCompanies = Object.entries(companyRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([companyId, revenue]) => ({
          companyId,
          name: companyIdToName[companyId] || 'Unknown',
          revenue
        }));
      setTopCompanies(sortedCompanies);
      setLoadingCharts(false);
    }
    fetchChartData();
  }, []);
  async function fetchPendingCompanies() {
    const res = await fetch('https://backend-eight-tan-16.vercel.app/company/auth/companies');
    const data = await res.json();
    // Only companies with verificationStatus 'pending'
    setPendingCompanies((data.companies || []).filter(c => c.verificationStatus === 'pending'));
  }
  useEffect(() => {
   
    fetchPendingCompanies();
  }, []);
  useEffect( ()=>{
    if(socket){
      console.log('here');
      socket.on('verif',async(data)=>{
        if(data.action==='pen')
        {
          await fetchPendingCompanies()
        }
      })
    }
  })

  useEffect(() => {
    async function fetchApprovedCompanies() {
      const res = await fetch('https://backend-eight-tan-16.vercel.app/company/auth/companies');
      const data = await res.json();
      // Only companies with verificationStatus 'approved'
      setApprovedCompanies((data.companies || []).filter(c => c.verificationStatus === 'approved'));
    }
    fetchApprovedCompanies();
  }, []);

  useEffect(() => {
    async function fetchPendingPackages() {
      const toursRes = await fetch('https://backend-eight-tan-16.vercel.app/api/tours');
      const toursData = await toursRes.json();
      setPendingPackages((toursData.tours || []).filter(t => t.status === 'pending'));
    }
    fetchPendingPackages();
  }, []);
  useEffect(() => {
    const handleTourApprovalRequest = (data) => {
      setPendingPackages(prev => {
        if (!prev.some(tour => tour._id === data.tourId)) {
          const newTour = {
            _id: data.tourId,
            name: data.tourName,
            companyName: data.companyName,
            companyId: data.companyId,
            status: 'pending',
            price: data.price,
            timestamp: data.timestamp
          };
          return [...prev, newTour];
        }
        return prev;
      });
    };
    socket.on('tour_approval_request', handleTourApprovalRequest);
    return () => socket.off('tour_approval_request', handleTourApprovalRequest);
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <div className="date-time">
          <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="analytics-overview">
        <div className="card primary-card">
          <div className="card-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="card-content">
            <h3>Active Packages</h3>
            <p className="card-value">{upcomingTrips}</p>
            <p className="card-trend positive">
              <i className="fas fa-arrow-up"></i>
            </p>
          </div>
        </div>

        <div className="card success-card">
          <div className="card-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="card-content">
            <h3>Companies</h3>
            <p className="card-value">{approvedCompanies.length}</p>
            <p className="card-trend positive">
              <i className="fas fa-arrow-up"></i>
            </p>
          </div>
        </div>

        <div className="card info-card">
          <div className="card-icon">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="card-content">
            <h3>Total Revenue</h3>
            <p className="card-value">${bookingsData.totalRevenue?.toLocaleString() || 0}</p>
            <p className="card-trend positive">
              <i className="fas fa-arrow-up"></i>
            </p>
          </div>
        </div>

        <div className="card warning-card">
          <div className="card-icon">
            <i className="fas fa-flag-checkered"></i>
          </div>
          <div className="card-content">
            <h3>Finished Trips</h3>
            <p className="card-value">{finishedTrips}</p>
            <p className="card-trend positive">
              <i className="fas fa-arrow-up"></i>
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* New Companies Section - Modern Card UI */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3><i className="fas fa-building"></i> New Companies</h3>
            {/* <button className="view-all-btn">View All</button> */}
          </div>
          <div className="modern-card-list">
            {pendingCompanies.map(company => (
              <div key={company._id} className="modern-card company-modern-card">
                <div className="modern-card-avatar">
                  <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${company.name}`} alt={company.name} />
                </div>
                <div className="modern-card-info">
                  <h4>{company.name}</h4>
                  <p className="modern-card-email">{company.email}</p>
                  <p className="modern-card-phone">{company.phone}</p>
                  <p className="modern-card-address">{company.address}</p>
                </div>
                <div className="modern-card-actions">
                  <button className="modern-btn view" onClick={() => navigate(`/admin/registration-request/${company._id}`)}>View Details</button>
                </div>
              </div>
            ))}
            {pendingCompanies.length === 0 && <div style={{ padding: '1rem', color: '#888' }}>No pending registration requests.</div>}
          </div>
        </div>
        {/* New Packages Section - Modern Card UI */}
        <div className="dashboard-section" style={{ marginTop: 0 }}>
          <div className="section-header">
            <h3><i className="fas fa-box"></i> New Packages Waiting For Approval</h3>
          </div>
          <div className="modern-card-list">
            {pendingPackages.map(pkg => (
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
            {pendingPackages.length === 0 && <div style={{ padding: '1rem', color: '#888' }}>No pending packages.</div>}
          </div>
        </div>
        {/* Revenue Bar Chart Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3><i className="fas fa-chart-bar"></i> Revenue Earned (Last 12 Months)</h3>
          </div>
          {loadingCharts ? <p>Loading chart...</p> :
            <Bar
              data={{
                labels: barLabels,
                datasets: [
                  {
                    label: 'Revenue (USD)',
                    data: revenueByMonth,
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
                  y: { beginAtZero: true }
                }
              }}
            />
          }
        </div>
        {/* Top Companies Pie Chart Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3><i className="fas fa-chart-pie"></i> Top 10 Companies by Revenue (Last Month)</h3>
          </div>
          {loadingCharts ? <p>Loading chart...</p> :
            <Pie
              data={{
                labels: topCompanies.map(c => c.name),
                datasets: [
                  {
                    data: topCompanies.map(c => c.revenue),
                    backgroundColor: [
                      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                      '#FF9F40', '#C9CBCF', '#FF6384AA', '#36A2EBAA', '#FFCE56AA'
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
          }
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

