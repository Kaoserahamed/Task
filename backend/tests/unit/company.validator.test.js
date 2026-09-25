'use strict';

const {
  parseCompanyRegister,
  parseCompanyInfoUpdate,
  parseCompanyVerificationUpdate,
} = require('../../validators/company.validator');

describe('company request schemas', () => {
  test('normalizes registration values and rejects malformed fields', () => {
    expect(
      parseCompanyRegister({
        name: '  Ada Tours  ',
        email: 'ADA@EXAMPLE.COM',
        password: 'secret123',
        isAdmin: true,
      })
    ).toEqual({ name: 'Ada Tours', email: 'ada@example.com', password: 'secret123' });

    expect(() =>
      parseCompanyRegister({ name: 42, email: 'a@b.co', password: 'secret123' })
    ).toThrow('"name" must be a string');
    expect(() =>
      parseCompanyRegister({ name: 'Ada', email: 'not-an-email', password: 'secret123' })
    ).toThrow('"email" must be a valid email address');
    expect(() => parseCompanyRegister({ name: 'Ada', email: 'a@b.co', password: 'short' })).toThrow(
      '"password" must be at least 8 characters'
    );
  });

  test('allows only known company profile fields and a pending license request', () => {
    expect(
      parseCompanyInfoUpdate({
        name: 'Ada Tours',
        description: 'Small group trips',
        isVerified: true,
        __v: 99,
        verificationStatus: 'pending',
        website: 'https://ada.example',
        ownerDob: '1990-02-03',
      })
    ).toEqual({
      name: 'Ada Tours',
      description: 'Small group trips',
      website: 'https://ada.example/',
      ownerDob: '1990-02-03',
      verificationStatus: 'pending',
    });

    expect(() => parseCompanyInfoUpdate({ verificationStatus: 'approved' })).toThrow(
      '"verificationStatus" may only be set to "pending" by a company'
    );
    expect(() => parseCompanyInfoUpdate({ website: 'javascript:alert(1)' })).toThrow(
      '"website" must be a valid http(s) URL'
    );
    expect(() => parseCompanyInfoUpdate({ ownerDob: 'not-a-date' })).toThrow(
      '"ownerDob" must be a valid date'
    );
  });

  test('validates the admin decision fields and rejects prototype-style payloads', () => {
    expect(
      parseCompanyVerificationUpdate({
        companyId: 'company-1',
        verificationStatus: 'approved',
        isVerified: true,
        role: 'admin',
      })
    ).toEqual({ companyId: 'company-1', verificationStatus: 'approved', isVerified: true });

    expect(() => parseCompanyVerificationUpdate({ verificationStatus: 'verified-ish' })).toThrow(
      'Unknown verification status'
    );
    expect(() => parseCompanyVerificationUpdate({ isVerified: 'true' })).toThrow(
      '"isVerified" must be a boolean'
    );
    expect(() => parseCompanyVerificationUpdate({ companyId: 'company-1' })).toThrow(
      'Provide verificationStatus or isVerified with companyId'
    );
    expect(() => parseCompanyVerificationUpdate({})).toThrow(
      'Provide a companyId, verificationStatus, or isVerified'
    );
  });
});
