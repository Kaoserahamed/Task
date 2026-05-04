import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import socket from '../../socket';
import jsPDF from 'jspdf';
import './License.css';

const emptySocialLinks = {
  facebook: '',
  twitter: '',
  linkedin: '',
  instagram: '',
  website: '',
};

const License = () => {
  const { company, updateCompany } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    ...company?.company,
    socialLinks: { ...emptySocialLinks, ...(company?.company?.socialLinks || {}) },
    documents: company?.company?.documents || [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [status, setStatus] = useState('Not Verified');

  useEffect(() => {
    // Join company-specific socket room on mount
    if (company?.company?._id) {
      console.log('Joining company room:', company.company._id);
      socket.emit('join_company', company.company._id);
    }

    // Listen for license responses
    socket.on('license_response', (data) => {
      console.log('Received license response:', data);
      if (data.companyId === company?.company?._id) {
        console.log('Updating status to:', data.verificationStatus);
        setStatus(data.verificationStatus);
      }
    });

    // Cleanup socket listener on unmount
    return () => {
      socket.off('license_response');
    };
  }, [company?.company?._id]);

  useEffect(() => {
    // Always fetch the latest company info on mount
    const fetchCompany = async () => {
      try {
        const token = localStorage.getItem('company-token');
        const res = await fetch('https://backend-eight-tan-16.vercel.app/company/auth/companies');
        const data = await res.json();
        // Find this company by id
        const myCompany = (data.companies || []).find(c => c._id === company?.company?._id);
        if (myCompany) {
          setForm({
            ...myCompany,
            socialLinks: { ...emptySocialLinks, ...(myCompany.socialLinks || {}) },
            documents: myCompany.documents || [],
          });
        }
      } catch (err) {
        // ignore
      }
    };
    fetchCompany();
    // eslint-disable-next-line
  }, []);

  // On mount, fetch initial status from DB
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('https://backend-eight-tan-16.vercel.app/company/auth/companies');
        const data = await res.json();
        const myCompany = (data.companies || []).find(c => c._id === company?.company?._id);
        if (myCompany) {
          if (myCompany.verificationStatus === 'pending') setStatus('Pending');
          else if (myCompany.verificationStatus === 'approved') setStatus('Approved');
          else if (myCompany.verificationStatus === 'rejected') setStatus('Rejected');
          else setStatus('Not Verified');
        } else {
          setStatus('Not Verified');
        }
      } catch {
        setStatus('Not Verified');
      }
    };
    if (company?.company?._id) fetchStatus();
  }, [company?.company?._id]);

  // Listen for license_response from admin and update status immediately
  useEffect(() => {
    console.log('License.jsx - Socket connected:', socket.connected); // Debug socket connection
    if (!company?.company?._id) return;
    const handleLicenseResponse = (data) => {
      console.log('Received license_response:', data); // Debug received event
      if (data.companyId === company.company._id) {
        if (data.verificationStatus === 'approved') setStatus('Approved');
        else if (data.verificationStatus === 'rejected') setStatus('Rejected');
        else if (data.verificationStatus === 'pending') setStatus('Pending');
        else setStatus('Not Verified');
        setForm((prev) => ({
          ...prev,
          verificationStatus: data.verificationStatus
        }));
      }
    };
    socket.on('license_response', handleLicenseResponse);
    return () => {
      socket.off('license_response', handleLicenseResponse);
    };
  }, [company?.company?._id]);

  // Status logic
  const isPending = status === 'Pending';
  const isApproved = status === 'Approved';
  const isRejected = status === 'Rejected';
  const isNotVerified = !status || (status !== 'Pending' && status !== 'Approved' && status !== 'Rejected');

  if (!company) return <div className="license-container">No company data found.</div>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [name]: value } }));
  };

  const handleEdit = () => {
    setEditMode(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm({
      ...company.company,
      socialLinks: { ...emptySocialLinks, ...(company.company.socialLinks || {}) },
      documents: company.company.documents || [],
    });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setPasswordError('');
    try {
      // Verify password before saving
      const token = localStorage.getItem('company-token');
      const res = await fetch('https://backend-eight-tan-16.vercel.app/company/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!data.success) {
        setPasswordError(data.message || 'Incorrect password');
        setLoading(false);
        return;
      }
      await updateCompany(form);
      setSuccess('Company info updated!');
      setEditMode(false);
      setPassword('');
    } catch (err) {
      setError('Failed to update company info.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLicense = async () => {
    setRequestLoading(true);
    setRequestError('');
    setRequestSuccess('');
    try {
      await updateCompany({ ...form, verificationStatus: 'pending' });
      setStatus('Pending'); // Instantly update status to Pending
      socket.emit('license_request', {
        action: 'license_request',
        company: { ...company.company, ...form, verificationStatus: 'pending' }
      });
      setRequestSuccess('License request sent!');
    } catch (err) {
      setRequestError('Failed to send license request.');
    } finally {
      setRequestLoading(false);
    }
  };

  // Helper for showing empty values
  const show = (val) => val || <span className="empty-value">-</span>;

  // PDF download functionality
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    let y = 14;
    doc.setFontSize(18);
    doc.text('Company License & Profile', 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text('Status: ' + (isApproved ? 'Verified' : isPending ? 'Pending' : isRejected ? 'Rejected' : 'Not Verified'), 14, y);
    y += 10;

    // Only include fields shown in the form
    doc.setFontSize(14);
    doc.text('Basic Information', 14, y);
    y += 8;
    const addField = (label, value) => {
      doc.setFontSize(11);
      doc.text(`${label}: ${value || '-'}`, 14, y);
      y += 7;
    };
    addField('Name', form.name);
    addField('Email', form.email);
    addField('Phone', form.phone);
    addField('Address', form.address);
    addField('Website', form.website);
    addField('Description', form.description);

    y += 3;
    doc.setFontSize(14);
    doc.text('Business Details', 14, y);
    y += 8;
    addField('Registration #', form.registrationNumber);
    addField('Tax ID', form.taxId);
    addField('License #', form.licenseNumber);
    addField('License Expiry', form.licenseExpiry ? (new Date(form.licenseExpiry).toLocaleDateString()) : '-');

    y += 3;
    doc.setFontSize(14);
    doc.text('Documents', 14, y);
    y += 8;
    addField('Documents', form.documents && form.documents.length > 0
      ? (Array.isArray(form.documents)
          ? form.documents.map(d => d.name || d).join(', ')
          : '-')
      : '-');

    y += 3;
    doc.setFontSize(14);
    doc.text('Owner Information', 14, y);
    y += 8;
    addField('Owner Name', form.ownerName);
    addField('Owner Email', form.ownerEmail);
    addField('Owner Phone', form.ownerPhone);
    addField('Owner Address', form.ownerAddress);
    addField('Owner National ID', form.ownerNationalId);
    addField('Owner DOB', form.ownerDob ? (new Date(form.ownerDob).toLocaleDateString()) : '-');
    addField('Owner Nationality', form.ownerNationality);

    doc.save('company_license_profile.pdf');
  };

  return (
    <div className="license-container">
      <h2>Company License & Profile</h2>
      <div className="license-status">
        <span>Status: </span>
        <span className={
          status === 'Approved' ? 'verified' :
          status === 'Pending' ? 'pending' :
          status === 'Rejected' ? 'not-verified' : 'not-verified'
        }>
          {status}
        </span>
      </div>
      <form className="license-form" onSubmit={e => e.preventDefault()}>
        <div className="section-title">Basic Information</div>
        <div className="form-row">
          <label>Name:</label>
          {editMode ? (
            <input name="name" value={form.name || ''} onChange={handleChange} />
          ) : show(company.company.name)}
        </div>
        <div className="form-row">
          <label>Email:</label>
          {editMode ? (
            <input name="email" value={form.email || ''} onChange={handleChange} />
          ) : show(company.company.email)}
        </div>
        <div className="form-row">
          <label>Phone:</label>
          {editMode ? (
            <input name="phone" value={form.phone || ''} onChange={handleChange} />
          ) : show(company.company.phone)}
        </div>
        <div className="form-row">
          <label>Address:</label>
          {editMode ? (
            <input name="address" value={form.address || ''} onChange={handleChange} />
          ) : show(company.company.address)}
        </div>
        <div className="form-row">
          <label>Website:</label>
          {editMode ? (
            <input name="website" value={form.website || ''} onChange={handleChange} />
          ) : show(company.company.website)}
        </div>
        <div className="form-row">
          <label>Description:</label>
          {editMode ? (
            <textarea name="description" value={form.description || ''} onChange={handleChange} />
          ) : show(company.company.description)}
        </div>
        <div className="form-row">
          <label>Logo:</label>
          <span className="logo-placeholder">[Logo upload not implemented]</span>
        </div>
        <div className="section-title">Business Details</div>
        <div className="form-row">
          <label>Registration #:</label>
          <span>{show(company.company.registrationNumber)}</span>
        </div>
        <div className="form-row">
          <label>Tax ID:</label>
          <span>{show(company.company.taxId)}</span>
        </div>
        <div className="form-row">
          <label>License #:</label>
          <span>{show(company.company.licenseNumber)}</span>
        </div>
        <div className="form-row">
          <label>License Expiry:</label>
          <span>{show(company.company.licenseExpiry ? (new Date(company.company.licenseExpiry).toLocaleDateString()) : '')}</span>
        </div>
        <div className="section-title">Documents</div>
        <div className="form-row">
          <label>Documents:</label>
          {editMode ? (
            <input
              name="documents"
              type="file"
              accept="application/pdf"
              multiple
              onChange={e => {
                const files = Array.from(e.target.files);
                // Only accept PDFs
                const pdfFiles = files.filter(file => file.type === "application/pdf");
                setForm(prev => ({
                  ...prev,
                  documents: pdfFiles
                }));
              }}
            />
          ) : (
            <span>
              {company.company.documents && company.company.documents.length > 0
                ? company.company.documents.join(', ')
                : <span className="empty-value">-</span>}
            </span>
          )}
        </div>
        <div className="section-title">Owner Information</div>
        <div className="form-row">
          <label>Owner Name:</label>
          {editMode ? (
            <input name="ownerName" value={form.ownerName || ''} onChange={handleChange} />
          ) : show(company.company.ownerName)}
        </div>
        <div className="form-row">
          <label>Owner Email:</label>
          {editMode ? (
            <input name="ownerEmail" value={form.ownerEmail || ''} onChange={handleChange} />
          ) : show(company.company.ownerEmail)}
        </div>
        <div className="form-row">
          <label>Owner Phone:</label>
          {editMode ? (
            <input name="ownerPhone" value={form.ownerPhone || ''} onChange={handleChange} />
          ) : show(company.company.ownerPhone)}
        </div>
        <div className="form-row">
          <label>Owner Address:</label>
          {editMode ? (
            <input name="ownerAddress" value={form.ownerAddress || ''} onChange={handleChange} />
          ) : show(company.company.ownerAddress)}
        </div>
        <div className="form-row">
          <label>Owner National ID:</label>
          {editMode ? (
            <input name="ownerNationalId" value={form.ownerNationalId || ''} onChange={handleChange} />
          ) : show(company.company.ownerNationalId)}
        </div>
        <div className="form-row">
          <label>Owner DOB:</label>
          {editMode ? (
            <input name="ownerDob" value={form.ownerDob || ''} onChange={handleChange} type="date" />
          ) : show(company.company.ownerDob ? (new Date(company.company.ownerDob).toLocaleDateString()) : '')}
        </div>
        <div className="form-row">
          <label>Owner Nationality:</label>
          {editMode ? (
            <input name="ownerNationality" value={form.ownerNationality || ''} onChange={handleChange} />
          ) : show(company.company.ownerNationality)}
        </div>
        <div className="form-row">
          <label>Owner Photo:</label>
          {editMode ? (
            <span className="logo-placeholder">[Photo upload not implemented]</span>
          ) : (
            company.company.ownerPhoto ? (
              <img src={company.company.ownerPhoto} alt="Owner" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ccc' }} />
            ) : <span className="empty-value">-</span>
          )}
        </div>
        {editMode && (
          <>
            <div className="form-row">
              <label>Password (for verification):</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            {passwordError && <span className="error-msg">{passwordError}</span>}
          </>
        )}

        {editMode ? (
          <div className="form-actions">
            <button type="button" onClick={handleSave} disabled={loading}>Save</button>
            <button type="button" onClick={handleCancel} disabled={loading}>Cancel</button>
            {error && <span className="error-msg">{error}</span>}
            {success && <span className="success-msg">{success}</span>}
          </div>
        ) : (
          <div className="form-actions">
            <button type="button" onClick={handleEdit} disabled={status === 'Pending' || status === 'Approved'}>Edit Info</button>
          </div>
        )}
      </form>
      <div className="license-request-section">
        <button
          className="request-license-btn"
          onClick={handleRequestLicense}
          disabled={status === 'Pending' || status === 'Approved' || requestLoading || editMode}
        >
          {status === 'Approved' ? 'Already Verified' : status === 'Pending' ? 'Request Pending' : 'Request Verification'}
        </button>
        <button
          className="download-pdf-btn"
          onClick={handleDownloadPDF}
          title="Download PDF"
          disabled={editMode}
        >
          Download PDF
        </button>
        {requestError && <span className="error-msg">{requestError}</span>}
        {requestSuccess && <span className="success-msg">{requestSuccess}</span>}
      </div>
    </div>
  );
};

export default License;

