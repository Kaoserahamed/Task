'use strict';

const storage = require('../../config/storage');

describe('S3 storage policy', () => {
  test('accepts supported image metadata and rejects oversized files', () => {
    expect(
      storage.validateUpload({ filename: 'photo.png', contentType: 'image/png', size: 1024 })
    ).toEqual({
      contentType: 'image/png',
      extension: '.png',
    });
    expect(() =>
      storage.validateUpload({
        filename: 'photo.png',
        contentType: 'image/png',
        size: 5 * 1024 * 1024 + 1,
      })
    ).toThrow('between 1 byte and 5 MB');
  });

  test('rejects MIME/extension mismatches and executable content', () => {
    expect(() =>
      storage.validateUpload({ filename: 'payload.exe', contentType: 'image/png', size: 10 })
    ).toThrow('extension does not match');
    expect(() =>
      storage.validateUpload({
        filename: 'payload.png',
        contentType: 'application/x-msdownload',
        size: 10,
      })
    ).toThrow('Only JPEG, PNG, WebP and GIF images are allowed');
  });

  test('stable object URLs encode each object-key segment', () => {
    expect(storage.stableObjectUrl('uploads/2026-01-01/photo one.png')).toBe(
      '/api/storage/object/uploads/2026-01-01/photo%20one.png'
    );
  });
});
