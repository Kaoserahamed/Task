import { fireEvent, render, screen } from '@testing-library/react';
import ImagesSection from './ImagesSection';

const noop = () => {};

describe('ImagesSection', () => {
  test('renders a preview for every stored image', () => {
    render(
      <ImagesSection
        tourDetails={{ images: ['uploads/one.png', 'uploads/two.png'] }}
        handleFileChange={noop}
        handleRemoveImage={noop}
      />
    );

    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getByAltText('preview-0')).toHaveAttribute(
      'src',
      expect.stringContaining('/uploads/one.png')
    );
  });

  test('asks the form state to remove the clicked image', () => {
    const handleRemoveImage = jest.fn();

    render(
      <ImagesSection
        tourDetails={{ images: ['uploads/one.png'] }}
        handleFileChange={noop}
        handleRemoveImage={handleRemoveImage}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(handleRemoveImage).toHaveBeenCalledWith(0);
  });
});
