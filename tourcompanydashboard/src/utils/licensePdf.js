import jsPDF from 'jspdf';
import { statusLabel } from './licenseStatus';

export const downloadLicensePdf = (form, status) => {
  const doc = new jsPDF();
  let y = 14;
  doc.setFontSize(18);
  doc.text('Company License & Profile', 14, y);
  y += 10;
  doc.setFontSize(12);
  doc.text(`Status: ${statusLabel(status)}`, 14, y);
  y += 10;

  const addField = (label, value) => {
    doc.setFontSize(11);
    doc.text(`${label}: ${value || '-'}`, 14, y);
    y += 7;
  };

  doc.setFontSize(14);
  doc.text('Basic Information', 14, y);
  y += 8;
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
  addField(
    'License Expiry',
    form.licenseExpiry ? new Date(form.licenseExpiry).toLocaleDateString() : '-'
  );

  y += 3;
  doc.setFontSize(14);
  doc.text('Documents', 14, y);
  y += 8;
  addField(
    'Documents',
    form.documents?.length > 0
      ? Array.isArray(form.documents)
        ? form.documents.map((document) => document.name || document).join(', ')
        : '-'
      : '-'
  );

  y += 3;
  doc.setFontSize(14);
  doc.text('Owner Information', 14, y);
  y += 8;
  addField('Owner Name', form.ownerName);
  addField('Owner Email', form.ownerEmail);
  addField('Owner Phone', form.ownerPhone);
  addField('Owner Address', form.ownerAddress);
  addField('Owner National ID', form.ownerNationalId);
  addField('Owner DOB', form.ownerDob ? new Date(form.ownerDob).toLocaleDateString() : '-');
  addField('Owner Nationality', form.ownerNationality);

  doc.save('company_license_profile.pdf');
};
