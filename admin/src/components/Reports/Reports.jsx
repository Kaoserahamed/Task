import React, { useState } from 'react';
import './Reports.css';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Sample data for reports
  const [reports, setReports] = useState([
    {
      id: 1,
      type: 'user',
      title: 'Poor service during Cox\'s Bazar tour',
      submittedBy: 'Rahul Ahmed',
      submittedAgainst: 'Travel Buddy Ltd',
      date: '2023-05-15',
      status: 'pending',
      priority: 'high',
      description: 'The tour guide was not knowledgeable and the accommodation was below the standard promised in the package.',
    },
    {
      id: 2,
      type: 'company',
      title: 'Customer refused to follow safety guidelines',
      submittedBy: 'Green Tours',
      submittedAgainst: 'Karim Uddin',
      date: '2023-05-12',
      status: 'resolved',
      priority: 'medium',
      description: 'The customer repeatedly ignored safety instructions during the boat tour in Sundarbans, putting themselves and others at risk.',
    },
    {
      id: 3,
      type: 'user',
      title: 'Misleading tour package information',
      submittedBy: 'Sabina Akter',
      submittedAgainst: 'Explore Bangladesh',
      date: '2023-05-10',
      status: 'in-progress',
      priority: 'high',
      description: 'The tour package advertised 4-star accommodation but we were provided with a 2-star hotel. The food quality was also poor.',
    },
    {
      id: 4,
      type: 'company',
      title: 'Customer damaged hotel property',
      submittedBy: 'Adventure Tours',
      submittedAgainst: 'Momin Khan',
      date: '2023-05-08',
      status: 'pending',
      priority: 'low',
      description: 'The customer damaged furniture in the hotel room and refused to pay for repairs.',
    },
    {
      id: 5,
      type: 'user',
      title: 'Tour cancelled without proper refund',
      submittedBy: 'Tahmina Begum',
      submittedAgainst: 'Island Explorers',
      date: '2023-05-05',
      status: 'resolved',
      priority: 'high',
      description: 'My tour was cancelled just 2 days before the departure date and I was only refunded 50% of the amount.',
    },
    {
      id: 6,
      type: 'company',
      title: 'Customer misbehavior with staff',
      submittedBy: 'Sylhet Travels',
      submittedAgainst: 'Rahim Miah',
      date: '2023-05-03',
      status: 'in-progress',
      priority: 'medium',
      description: 'The customer was verbally abusive to our female staff members during the tour.',
    }
  ]);

  // Filter reports based on active tab and search term
  const filteredReports = reports.filter(report => {
    // Filter by tab
    if (activeTab !== 'all' && report.type !== activeTab && report.status !== activeTab) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && 
        !report.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !report.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !report.submittedAgainst.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Sort reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'priority') {
      const priorityOrder = { low: 1, medium: 2, high: 3 };
      return sortOrder === 'asc'
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return 0;
  });

  const handleStatusChange = (id, newStatus) => {
    setReports(reports.map(report => 
      report.id === id ? { ...report, status: newStatus } : report
    ));
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'in-progress': return 'status-in-progress';
      case 'resolved': return 'status-resolved';
      default: return '';
    }
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Reports & Complaints</h2>
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search by title, submitted by, or against..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search search-icon"></i>
        </div>
      </div>

      <div className="reports-filters">
        <div className="filter-tabs">
          <button 
            className={activeTab === 'all' ? 'active' : ''} 
            onClick={() => setActiveTab('all')}
          >
            All Reports
          </button>
          <button 
            className={activeTab === 'user' ? 'active' : ''} 
            onClick={() => setActiveTab('user')}
          >
            User Reports
          </button>
          <button 
            className={activeTab === 'company' ? 'active' : ''} 
            onClick={() => setActiveTab('company')}
          >
            Company Reports
          </button>
          <button 
            className={activeTab === 'pending' ? 'active' : ''} 
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button 
            className={activeTab === 'in-progress' ? 'active' : ''} 
            onClick={() => setActiveTab('in-progress')}
          >
            In Progress
          </button>
          <button 
            className={activeTab === 'resolved' ? 'active' : ''} 
            onClick={() => setActiveTab('resolved')}
          >
            Resolved
          </button>
        </div>

        <div className="sort-options">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Date</option>
            <option value="priority">Priority</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>

      <div className="reports-count">
        <p>Showing {sortedReports.length} reports</p>
      </div>

      <div className="reports-list">
        {sortedReports.map(report => (
          <div key={report.id} className="report-card">
            <div className="report-header">
              <div className="report-title-section">
                <span className={`report-type ${report.type === 'user' ? 'user-report' : 'company-report'}`}>
                  {report.type === 'user' ? 'User Report' : 'Company Report'}
                </span>
                <h3>{report.title}</h3>
              </div>
              <div className="report-status-section">
                <span className={`report-priority ${getPriorityClass(report.priority)}`}>
                  {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)} Priority
                </span>
                <span className={`report-status ${getStatusClass(report.status)}`}>
                  {report.status === 'in-progress' ? 'In Progress' : report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="report-details">
              <div className="report-info">
                <div className="info-item">
                  <i className="fas fa-user"></i>
                  <span><strong>Submitted by:</strong> {report.submittedBy}</span>
                </div>
                <div className="info-item">
                  <i className="fas fa-user-shield"></i>
                  <span><strong>Against:</strong> {report.submittedAgainst}</span>
                </div>
                <div className="info-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span><strong>Date:</strong> {new Date(report.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              <div className="report-description">
                <p>{report.description}</p>
              </div>
            </div>

            <div className="report-actions">
              <button className="action-btn view-btn">
                <i className="fas fa-eye"></i> View Details
              </button>
              
              {report.status === 'pending' && (
                <button 
                  className="action-btn process-btn"
                  onClick={() => handleStatusChange(report.id, 'in-progress')}
                >
                  <i className="fas fa-tasks"></i> Process Report
                </button>
              )}
              
              {report.status === 'in-progress' && (
                <button 
                  className="action-btn resolve-btn"
                  onClick={() => handleStatusChange(report.id, 'resolved')}
                >
                  <i className="fas fa-check-circle"></i> Mark as Resolved
                </button>
              )}
              
              <button className="action-btn contact-btn">
                <i className="fas fa-envelope"></i> Contact {report.type === 'user' ? 'User' : 'Company'}
              </button>
            </div>
          </div>
        ))}

        {sortedReports.length === 0 && (
          <div className="no-reports">
            <i className="fas fa-exclamation-circle"></i>
            <p>No reports found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};


export default Reports;
