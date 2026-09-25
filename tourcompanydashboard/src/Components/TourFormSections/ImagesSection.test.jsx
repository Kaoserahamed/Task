import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  test('creates and revokes local object URLs for selected files', async () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn().mockReturnValue('blob:preview');
    URL.revokeObjectURL = jest.fn();
    const file = new File(['image'], 'tour.jpg', { type: 'image/jpeg' });
    const { unmount } = render(
      <ImagesSection
        tourDetails={{ images: [file] }}
        handleFileChange={noop}
        handleRemoveImage={noop}
      />
    );

    await waitFor(() =>
      expect(screen.getByAltText('preview-0')).toHaveAttribute('src', 'blob:preview')
    );
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  test('announces image limits and invalid-file feedback', () => {
    render(
      <ImagesSection
        tourDetails={{ images: [] }}
        handleFileChange={noop}
        handleRemoveImage={noop}
        imageError="large.jpg: images must be between 1 byte and 5 MB."
      />
    );

    expect(screen.getByLabelText('Tour images')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('large.jpg');
    expect(screen.getByText(/up to 5 images/i)).toBeInTheDocument();
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
