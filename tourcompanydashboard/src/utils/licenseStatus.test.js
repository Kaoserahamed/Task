import {
  normalizeVerificationStatus,
  statusCanEdit,
  statusCanRequest,
  statusClassName,
  statusLabel,
} from './licenseStatus';

describe('license status helpers', () => {
  test('normalizes supported and unknown verification values', () => {
    expect(normalizeVerificationStatus('approved')).toBe('Approved');
    expect(normalizeVerificationStatus('verified')).toBe('Approved');
    expect(normalizeVerificationStatus('pending')).toBe('Pending');
    expect(normalizeVerificationStatus('rejected')).toBe('Rejected');
    expect(normalizeVerificationStatus(undefined)).toBe('Not Verified');
  });

  test('provides stable labels and CSS classes', () => {
    expect(statusLabel('Approved')).toBe('Verified');
    expect(statusLabel('Pending')).toBe('Pending');
    expect(statusLabel('Rejected')).toBe('Rejected');
    expect(statusClassName('Approved')).toBe('verified');
    expect(statusClassName('Pending')).toBe('pending');
    expect(statusClassName('Rejected')).toBe('not-verified');
  });

  test('blocks editing and new requests only for locked statuses', () => {
    expect(statusCanEdit('Not Verified')).toBe(true);
    expect(statusCanEdit('Rejected')).toBe(true);
    expect(statusCanEdit('Pending')).toBe(false);
    expect(statusCanEdit('Approved')).toBe(false);
    expect(statusCanRequest('Not Verified')).toBe(true);
    expect(statusCanRequest('Rejected')).toBe(true);
    expect(statusCanRequest('Pending')).toBe(false);
    expect(statusCanRequest('Approved')).toBe(false);
  });
});
