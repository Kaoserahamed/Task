import { selectTourImages } from './tourImages';

const photo = (name, { size = 5, ...options } = {}) =>
  new File(['x'.repeat(size)], name, {
    type: 'image/jpeg',
    lastModified: 1,
    ...options,
  });

describe('selectTourImages', () => {
  test('accepts supported images up to the five-image limit', () => {
    const files = Array.from({ length: 5 }, (_, index) => photo(`tour-${index}.jpg`));
    const result = selectTourImages([], files);

    expect(result.images).toHaveLength(5);
    expect(result.error).toBe('');
  });

  test('accepts valid files from a mixed selection and reports invalid ones', () => {
    const valid = photo('valid.png', { type: 'image/png' });
    const result = selectTourImages(
      [],
      [
        photo('document.pdf', { type: 'application/pdf' }),
        valid,
        photo('large.jpg', { size: 5 * 1024 * 1024 + 1 }),
      ]
    );

    expect(result.images).toEqual([valid]);
    expect(result.error).toContain('use JPEG, PNG, WebP, or GIF');
    expect(result.error).toContain('between 1 byte and 5 MB');
  });

  test('rejects duplicates and images that would exceed the remaining slots', () => {
    const existing = Array.from({ length: 4 }, (_, index) => photo(`old-${index}.jpg`));
    const duplicate = existing[0];
    const extra = photo('new.jpg');
    const result = selectTourImages(existing, [duplicate, extra, photo('overflow.jpg')]);

    expect(result.images).toHaveLength(5);
    expect(result.images.at(-1)).toBe(extra);
    expect(result.error).toContain('already selected');
    expect(result.error).toContain('at most 5 images');
  });
});
