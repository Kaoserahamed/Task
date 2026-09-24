import { fireEvent, render, screen } from '@testing-library/react';
import LicenseDetailsFields from './LicenseDetailsFields';

const company = {
  name: 'Atlas Tours',
  email: 'hello@atlas.test',
  description: 'Guided adventures',
  licenseExpiry: '2027-06-01T00:00:00.000Z',
  documents: ['certificate.pdf'],
  ownerName: 'Ada Atlas',
  ownerDob: '1990-02-03T00:00:00.000Z',
  ownerPhoto: '/uploads/ada.png',
};

const noop = () => {};

describe('LicenseDetailsFields', () => {
  test('shows the stored company values in read mode', () => {
    render(
      <LicenseDetailsFields
        company={company}
        form={company}
        editMode={false}
        onChange={noop}
        onDocumentsChange={noop}
      />
    );

    expect(screen.getByText('Atlas Tours')).toBeInTheDocument();
    expect(screen.getByText('certificate.pdf')).toBeInTheDocument();
    expect(screen.getByText('Ada Atlas')).toBeInTheDocument();
    expect(screen.getByAltText('Owner')).toHaveAttribute('src', '/uploads/ada.png');
  });

  test('keeps edit controls controlled and reports input changes', () => {
    const onChange = jest.fn();
    render(
      <LicenseDetailsFields
        company={company}
        form={{ ...company, name: 'Atlas Adventures' }}
        editMode
        onChange={onChange}
        onDocumentsChange={noop}
      />
    );

    const nameInput = screen.getByLabelText('Name:');
    expect(nameInput).toHaveValue('Atlas Adventures');
    fireEvent.change(nameInput, { target: { value: 'New company name' } });
    expect(onChange).toHaveBeenCalled();
  });

  test('passes only PDF document selections to the form state', () => {
    const onDocumentsChange = jest.fn();
    render(
      <LicenseDetailsFields
        company={company}
        form={company}
        editMode
        onChange={noop}
        onDocumentsChange={onDocumentsChange}
      />
    );

    const pdf = new File(['pdf'], 'license.pdf', { type: 'application/pdf' });
    const image = new File(['image'], 'logo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Documents'), { target: { files: [pdf, image] } });

    expect(onDocumentsChange).toHaveBeenCalledWith([pdf]);
  });
});
