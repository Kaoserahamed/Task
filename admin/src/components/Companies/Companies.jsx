import React, { useState, useEffect } from 'react';
import {
  FaBuilding,
  FaIdCard,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendar,
  FaCheckCircle,
  FaInfoCircle,
  FaTimes
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Companies.css';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin-token');
      const response = await fetch('https://backend-eight-tan-16.vercel.app/api/companies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.companies);
      } else {
        throw new Error(data.error || 'Failed to fetch companies');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetails = (company) => {
    if (company.verificationStatus && company.verificationStatus.toLowerCase() === 'pending') {
      navigate(`/admin/registration-request/${company._id}`);
      return;
    }
    setSelectedCompany(company);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCompany(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <FaTimes /> {error}
      </div>
    );
  }

  return (
    <div className="companies-container">
      <div className="companies-header">
        <h1>Tour Companies</h1>
      </div>

      <div className="companies-grid">
        {companies.map((company) => (
          <div key={company._id} className="company-card">
            <h2>{company.name}</h2>
            <span className={`company-status status-${company.verificationStatus?.toLowerCase() || 'pending'}`}>
              {company.verificationStatus || 'Pending'}
            </span>
            
            <div className="company-info">
              <p><FaIdCard /> License: {company.licenseNumber}</p>
              <p><FaEnvelope /> {company.email}</p>
              <p><FaPhone /> {company.phone}</p>
              <p><FaMapMarkerAlt /> {company.address}</p>
            </div>

            <button 
              className="details-button"
              onClick={() => handleShowDetails(company)}
            >
              <FaInfoCircle /> View Details
            </button>
          </div>
        ))}
      </div>

      {/* Company Details Modal */}
      <div className={`company-modal ${showModal ? 'show' : ''}`} onClick={handleCloseModal}>
        {selectedCompany && (
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={handleCloseModal}>
              <FaTimes />
            </button>

            <h2>{selectedCompany.name}</h2>
            <div className="company-details">
              <div className="detail-section">
                <h3>Basic Information</h3>
                <div className="detail-item">
                  <FaBuilding />
                  <span className="detail-label">Company Name:</span>
                  <span>{selectedCompany.name}</span>
                </div>
                <div className="detail-item">
                  <FaEnvelope />
                  <span className="detail-label">Email:</span>
                  <span>{selectedCompany.email}</span>
                </div>
                <div className="detail-item">
                  <FaPhone />
                  <span className="detail-label">Phone:</span>
                  <span>{selectedCompany.phone}</span>
                </div>
                <div className="detail-item">
                  <FaMapMarkerAlt />
                  <span className="detail-label">Address:</span>
                  <span>{selectedCompany.address}</span>
                </div>
                <div className="detail-item">
                  <FaIdCard />
                  <span className="detail-label">License Number:</span>
                  <span>{selectedCompany.licenseNumber}</span>
                </div>
                {selectedCompany.licenseExpiry && (
                  <div className="detail-item">
                    <FaCalendar />
                    <span className="detail-label">License Expiry:</span>
                    <span>{new Date(selectedCompany.licenseExpiry).toLocaleDateString()}</span>
                  </div>
                )}
                {selectedCompany.website && (
                  <div className="detail-item">
                    <FaBuilding />
                    <span className="detail-label">Website:</span>
                    <span>{selectedCompany.website}</span>
                  </div>
                )}
                {selectedCompany.description && (
                  <div className="detail-item">
                    <FaInfoCircle />
                    <span className="detail-label">Description:</span>
                    <span>{selectedCompany.description}</span>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h3>Owner Information</h3>
                <div className="detail-item">
                  <FaIdCard />
                  <span className="detail-label">Owner Name:</span>
                  <span>{selectedCompany.ownerName}</span>
                </div>
                <div className="detail-item">
                  <FaEnvelope />
                  <span className="detail-label">Owner Email:</span>
                  <span>{selectedCompany.ownerEmail}</span>
                </div>
                <div className="detail-item">
                  <FaPhone />
                  <span className="detail-label">Owner Phone:</span>
                  <span>{selectedCompany.ownerPhone}</span>
                </div>
                <div className="detail-item">
                  <FaMapMarkerAlt />
                  <span className="detail-label">Owner Address:</span>
                  <span>{selectedCompany.ownerAddress}</span>
                </div>
                {selectedCompany.ownerNationalId && (
                  <div className="detail-item">
                    <FaIdCard />
                    <span className="detail-label">National ID:</span>
                    <span>{selectedCompany.ownerNationalId}</span>
                  </div>
                )}
                {selectedCompany.ownerDob && (
                  <div className="detail-item">
                    <FaCalendar />
                    <span className="detail-label">Date of Birth:</span>
                    <span>{new Date(selectedCompany.ownerDob).toLocaleDateString()}</span>
                  </div>
                )}
                {selectedCompany.ownerNationality && (
                  <div className="detail-item">
                    <FaIdCard />
                    <span className="detail-label">Nationality:</span>
                    <span>{selectedCompany.ownerNationality}</span>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h3>Business Information</h3>
                <div className="detail-item">
                  <FaIdCard />
                  <span className="detail-label">Registration Number:</span>
                  <span>{selectedCompany.registrationNumber}</span>
                </div>
                <div className="detail-item">
                  <FaIdCard />
                  <span className="detail-label">Tax ID:</span>
                  <span>{selectedCompany.taxId}</span>
                </div>
                <div className="detail-item">
                  <FaCheckCircle />
                  <span className="detail-label">Verification Status:</span>
                  <span className={`status-${selectedCompany.verificationStatus?.toLowerCase() || 'pending'}`}>
                    {selectedCompany.verificationStatus || 'Pending'}
                  </span>
                </div>
                <div className="detail-item">
                  <FaCalendar />
                  <span className="detail-label">Joined:</span>
                  <span>{new Date(selectedCompany.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {selectedCompany.verificationDocuments && selectedCompany.verificationDocuments.length > 0 && (
                <div className="detail-section">
                  <h3>Verification Documents</h3>
                  <div className="documents-grid">
                    {selectedCompany.verificationDocuments.map((doc, index) => (
                      <div key={index} className="document-item">
                        <a href={doc} target="_blank" rel="noopener noreferrer">
                          Document {index + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Companies;
