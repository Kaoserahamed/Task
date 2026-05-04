import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './RegistrationRequest.css';
import socket from '../../socket';

const emptySocialLinks = {
  facebook: '',
  twitter: '',
  linkedin: '',
  instagram: '',
  website: '',
};

const RegistrationRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    console.log('Socket connected:', socket.connected); // Debug socket connection
    async function fetchCompany() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`https://backend-eight-tan-16.vercel.app/company/auth/companies`);
        const data = await res.json();
        const found = (data.companies || []).find(c => c._id === id);
        setCompany(found || null);
        if (!found) setError('Company not found.');
      } catch (err) {
        setError('Failed to fetch company details.');
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [id]);

  const handleAction = async (status) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`https://backend-eight-tan-16.vercel.app/company/auth/update-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId: company._id, verificationStatus: status, isVerified: status === 'approved' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update status');
      setSuccess(`Company ${status === 'approved' ? 'approved' : 'declined'} successfully.`);
      setCompany(data.company);
      // Emit socket event to the company with status and isVerified
      socket.emit('license_response', {
        companyId: company._id,
        verificationStatus: status
      });
      console.log('Emitted license_response:', { companyId: company._id, verificationStatus: status }); // Debug emit
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError('Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="license-container">Loading...</div>;
  if (error) return <div className="license-container error-msg">{error}</div>;
  if (!company) return <div className="license-container">No company data found.</div>;

  const show = (val) => val || <span className="empty-value">-</span>;

  return (
    <div className="license-container">
      <h2>Company Registration Request</h2>
      <div className="license-status">
        <span>Status: </span>
        <span className={company.isVerified ? 'verified' : company.verificationStatus === 'pending' ? 'pending' : 'not-verified'}>
          {company.isVerified ? 'Verified' : company.verificationStatus === 'pending' ? 'Pending' : 'Not Verified'}
        </span>
      </div>
      <form className="license-form" onSubmit={e => e.preventDefault()}>
        <div className="section-title">Basic Information</div>
        <div className="form-row"><label>Name:</label>{show(company.name)}</div>
        <div className="form-row"><label>Email:</label>{show(company.email)}</div>
        <div className="form-row"><label>Phone:</label>{show(company.phone)}</div>
        <div className="form-row"><label>Address:</label>{show(company.address)}</div>
        <div className="form-row"><label>Website:</label>{show(company.website)}</div>
        <div className="form-row"><label>Description:</label>{show(company.description)}</div>
        <div className="form-row"><label>Logo:</label><span className="logo-placeholder">[Logo not shown]</span></div>
        <div className="section-title">Business Details</div>
        <div className="form-row"><label>Registration #:</label>{show(company.registrationNumber)}</div>
        <div className="form-row"><label>Tax ID:</label>{show(company.taxId)}</div>
        <div className="form-row"><label>License #:</label>{show(company.licenseNumber)}</div>
        <div className="form-row"><label>License Expiry:</label>{show(company.licenseExpiry ? (new Date(company.licenseExpiry).toLocaleDateString()) : '')}</div>
        <div className="section-title">Documents</div>
        <div className="form-row"><label>Documents:</label>{company.documents && company.documents.length > 0 ? company.documents.join(', ') : <span className="empty-value">-</span>}</div>
        <div className="section-title">Owner Information</div>
        <div className="form-row"><label>Owner Name:</label>{show(company.ownerName)}</div>
        <div className="form-row"><label>Owner Email:</label>{show(company.ownerEmail)}</div>
        <div className="form-row"><label>Owner Phone:</label>{show(company.ownerPhone)}</div>
        <div className="form-row"><label>Owner Address:</label>{show(company.ownerAddress)}</div>
        <div className="form-row"><label>Owner National ID:</label>{show(company.ownerNationalId)}</div>
        <div className="form-row"><label>Owner DOB:</label>{show(company.ownerDob ? (new Date(company.ownerDob).toLocaleDateString()) : '')}</div>
        <div className="form-row"><label>Owner Nationality:</label>{show(company.ownerNationality)}</div>
        <div className="form-row"><label>Owner Photo:</label><span className="logo-placeholder">[Photo not shown]</span></div>
      </form>
      <div className="license-request-section">
        <button className="request-license-btn" style={{background: '#388e3c'}} onClick={() => handleAction('approved')} disabled={actionLoading || company.verificationStatus === 'approved'}>Approve</button>
        <button className="request-license-btn" style={{background: '#e74c3c', marginLeft: 10}} onClick={() => handleAction('rejected')} disabled={actionLoading || company.verificationStatus === 'rejected'}>Decline</button>
        {error && <span className="error-msg">{error}</span>}
        {success && <span className="success-msg">{success}</span>}
      </div>
    </div>
  );
};

export default RegistrationRequest;

