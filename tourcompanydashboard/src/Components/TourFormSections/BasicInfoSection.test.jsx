import { fireEvent, render, screen } from '@testing-library/react';
import BasicInfoSection from './BasicInfoSection';

const noop = () => {};

const details = {
  name: 'Hill Weekend',
  packageCategories: ['Nature & Eco'],
  customCategory: '',
  tourType: { single: false, group: true },
  duration: { days: 2, nights: 1 },
  maxGroupSize: '12',
  availableSeats: '10',
  startDate: '2026-07-01',
  endDate: '2026-07-02',
};

const renderSection = (props = {}) =>
  render(
    <BasicInfoSection
      tourDetails={details}
      packageCategories={['Nature & Eco']}
      handleChange={noop}
      handleDurationChange={noop}
      handleCategoryChange={noop}
      handleTourTypeChange={noop}
      {...props}
    />
  );

describe('BasicInfoSection', () => {
  test('locks create forms to group tours and shows group-only fields', () => {
    renderSection({ groupOnly: true });

    expect(screen.getByRole('checkbox', { name: 'Group' })).toBeDisabled();
    expect(screen.queryByRole('checkbox', { name: 'Single' })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Maximum Group Size')).toHaveValue(12);
  });

  test('keeps both tour types interactive when editing an existing tour', () => {
    const handleTourTypeChange = jest.fn();
    renderSection({ handleTourTypeChange });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Single' }));
    expect(handleTourTypeChange).toHaveBeenCalledWith('single');
  });
});
