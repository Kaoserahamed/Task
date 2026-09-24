import React from 'react';

const BASIC_FIELDS = [
  ['name', 'Name'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['address', 'Address'],
  ['website', 'Website'],
  ['description', 'Description'],
];

const BUSINESS_FIELDS = [
  ['registrationNumber', 'Registration #'],
  ['taxId', 'Tax ID'],
  ['licenseNumber', 'License #'],
  ['licenseExpiry', 'License Expiry'],
];

const OWNER_FIELDS = [
  ['ownerName', 'Owner Name'],
  ['ownerEmail', 'Owner Email'],
  ['ownerPhone', 'Owner Phone'],
  ['ownerAddress', 'Owner Address'],
  ['ownerNationalId', 'Owner National ID'],
  ['ownerDob', 'Owner DOB'],
  ['ownerNationality', 'Owner Nationality'],
];

const show = (value) => value || <span className="empty-value">-</span>;

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '');

const EditableField = ({ label, name, value, onChange, multiline = false }) => (
  <div className="form-row">
    <label htmlFor={name}>{label}:</label>
    {multiline ? (
      <textarea id={name} name={name} value={value || ''} onChange={onChange} />
    ) : (
      <input
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        type={name === 'ownerDob' ? 'date' : 'text'}
      />
    )}
  </div>
);

const ReadOnlyField = ({ label, value }) => (
  <div className="form-row">
    <label>{label}:</label>
    <span>{show(value)}</span>
  </div>
);

const LicenseDetailsFields = ({ company, form, editMode, onChange, onDocumentsChange }) => (
  <>
    <div className="section-title">Basic Information</div>
    {BASIC_FIELDS.map(([name, label]) =>
      editMode ? (
        <EditableField
          key={name}
          label={label}
          name={name}
          value={form[name]}
          onChange={onChange}
          multiline={name === 'description'}
        />
      ) : (
        <ReadOnlyField key={name} label={label} value={company[name]} />
      )
    )}
    <div className="form-row">
      <label>Logo:</label>
      <span className="logo-placeholder">[Logo upload not implemented]</span>
    </div>

    <div className="section-title">Business Details</div>
    {BUSINESS_FIELDS.map(([name, label]) => (
      <ReadOnlyField
        key={name}
        label={label}
        value={name.endsWith('Expiry') ? formatDate(company[name]) : company[name]}
      />
    ))}

    <div className="section-title">Documents</div>
    <div className="form-row">
      <label>Documents:</label>
      {editMode ? (
        <input
          aria-label="Documents"
          name="documents"
          type="file"
          accept="application/pdf"
          multiple
          onChange={(event) => {
            const pdfFiles = Array.from(event.target.files).filter(
              (file) => file.type === 'application/pdf'
            );
            onDocumentsChange(pdfFiles);
          }}
        />
      ) : (
        <span>{show(company.documents?.length ? company.documents.join(', ') : '')}</span>
      )}
    </div>

    <div className="section-title">Owner Information</div>
    {OWNER_FIELDS.map(([name, label]) =>
      editMode ? (
        <EditableField
          key={name}
          label={label}
          name={name}
          value={form[name]}
          onChange={onChange}
        />
      ) : (
        <ReadOnlyField
          key={name}
          label={label}
          value={name === 'ownerDob' ? formatDate(company[name]) : company[name]}
        />
      )
    )}
    <div className="form-row">
      <label>Owner Photo:</label>
      {editMode ? (
        <span className="logo-placeholder">[Photo upload not implemented]</span>
      ) : company.ownerPhoto ? (
        <img
          src={company.ownerPhoto}
          alt="Owner"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1px solid #ccc',
          }}
        />
      ) : (
        show('')
      )}
    </div>
  </>
);

export default LicenseDetailsFields;
