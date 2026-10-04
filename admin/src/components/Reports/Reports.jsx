import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './Reports.css';
import selectReports from '../../utils/reportFilters';
import StatusState from '../ui/StatusState';
import { fetchReports, updateReportStatus } from '../../api/reports';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reports are a server-owned moderation queue. The view used to seed itself
  // with a hardcoded array of sample complaints and mutate status in local
  // state, which meant nothing an operator did survived a refresh and no real
  // report could ever appear here. The API module is the only way in, and the
  // filtering/sorting rules stay in `utils/reportFilters.js`.
  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchReports();
      setReports(Array.isArray(data?.reports) ? data.reports : []);
    } catch (err) {
      setReports([]);
      setError(err.message || 'Could not load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleStatusChange = async (id, newStatus) => {
    // Optimistic update, rolled back from the server's copy if the call fails:
    // the operator sees the action land immediately, and a rejected PATCH
    // leaves the row in the state the API actually holds.
    const previous = reports;
    setReports(
      reports.map((report) => (report.id === id ? { ...report, status: newStatus } : report))
    );
    try {
      const data = await updateReportStatus(id, { status: newStatus });
      const confirmed = data?.report;
      if (confirmed) {
        setReports((current) => current.map((report) => (report.id === id ? confirmed : report)));
      }
      setError('');
    } catch (err) {
      setReports(previous);
      setError(err.message || `Could not mark report as ${newStatus}`);
    }
  };

  // Filtering and sorting rules live in utils/reportFilters.js so they can be
  // unit-tested without rendering the view.
  const sortedReports = useMemo(
    () => selectReports(reports, { tab: activeTab, searchTerm, sortBy, sortOrder }),
    [reports, activeTab, searchTerm, sortBy, sortOrder]
  );

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'in-progress':
        return 'status-in-progress';
      case 'resolved':
        return 'status-resolved';
      default:
        return '';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Reports & Complaints</h2>
        <div className="search-container">
          <input
            id="report-search"
            type="text"
            aria-label="Search reports"
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
          <button
            aria-label={`Sort ${sortOrder === 'desc' ? 'oldest' : 'newest'} first`}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>

      {/* A failed request must not look like an empty queue, so the error is
          announced in a live region with a retry rather than silently replaced
          by the "no reports" state below. */}
      {error && (
        <div className="reports-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadReports}>
            Retry
          </button>
        </div>
      )}

      {loading && <StatusState status="loading" title="Loading reports" />}

      {!loading && reports.length === 0 && !error && (
        <StatusState status="empty" title="No reports have been filed yet">
          Customer and tour-company complaints will appear here as they are filed.
        </StatusState>
      )}

      <div className="reports-count">
        <p>Showing {sortedReports.length} reports</p>
      </div>

      <div className="reports-list" role="list">
        {sortedReports.map((report) => (
          <div key={report.id} className="report-card" role="listitem" aria-label={report.title}>
            <div className="report-header">
              <div className="report-title-section">
                <span
                  className={`report-type ${report.type === 'user' ? 'user-report' : 'company-report'}`}
                >
                  {report.type === 'user' ? 'User Report' : 'Company Report'}
                </span>
                <h3>{report.title}</h3>
              </div>
              <div className="report-status-section">
                <span className={`report-priority ${getPriorityClass(report.priority)}`}>
                  {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)} Priority
                </span>
                <span className={`report-status ${getStatusClass(report.status)}`}>
                  {report.status === 'in-progress'
                    ? 'In Progress'
                    : report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="report-details">
              <div className="report-info">
                <div className="info-item">
                  <i className="fas fa-user"></i>
                  <span>
                    <strong>Submitted by:</strong> {report.submittedBy}
                  </span>
                </div>
                <div className="info-item">
                  <i className="fas fa-user-shield"></i>
                  <span>
                    <strong>Against:</strong> {report.submittedAgainst}
                  </span>
                </div>
                <div className="info-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span>
                    <strong>Date:</strong>{' '}
                    {new Date(report.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
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
                <i className="fas fa-envelope"></i> Contact{' '}
                {report.type === 'user' ? 'User' : 'Company'}
              </button>
            </div>
          </div>
        ))}

        {/* Only meaningful when the queue itself has rows: if nothing has been
            filed, the empty state above already explains why the list is blank. */}
        {!loading && reports.length > 0 && sortedReports.length === 0 && (
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
