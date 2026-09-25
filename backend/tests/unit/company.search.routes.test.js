'use strict';

const request = require('supertest');

const createApp = require('../../app');
const { signAccessToken } = require('../../utils/token');

/**
 * Company directory and profile endpoints, end to end through the real
 * application. Together with `company.auth.routes.test.js` this pins the URLs,
 * the authorisation rules and the allow-list that replaced the single
 * `companyRoutes.js` router.
 */

jest.mock('../../models/company', () => {
  const Company = jest.fn();
  Company.findOne = jest.fn();
  Company.findById = jest.fn();
  Company.findByIdAndUpdate = jest.fn();
  Company.find = jest.fn();
  Company.schema = {
    paths: {
      name: {},
      email: {},
      phone: {},
      address: {},
      website: {},
      description: {},
      logo: {},
      isVerified: {},
      verificationStatus: { enumValues: ['Not Verified', 'pending', 'approved', 'rejected'] },
      verificationDocuments: {},
      review: {},
      ownerName: {},
      createdAt: {},
      resetToken: {},
      resetTokenExpiration: {},
      __v: {},
    },
  };
  return Company;
});

const Company = require('../../models/company');

const companyToken = () => signAccessToken('company-1', { companyId: 'company-1' });
const adminToken = () => signAccessToken('admin-1', { isAdmin: true });

/**
 * `Company.find()` is both awaited directly and chained with
 * `.select().limit()`; a thenable with the query methods covers both call
 * styles without stubbing Mongoose.
 */
const findResult = (value) => {
  const promise = Promise.resolve(value);
  promise.select = () => promise;
  promise.limit = () => promise;
  return promise;
};

describe('company directory and profile endpoints', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Company.find.mockReturnValue(findResult([]));
  });

  describe('public lookup', () => {
    test('GET /api/company/:id answers 404 with the standard shape', async () => {
      Company.findById.mockResolvedValue(null);

      const res = await request(app).get('/api/company/000000000000000000000000');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, message: 'Company not found' });
    });

    test('GET /api/company/:id returns the company', async () => {
      Company.findById.mockResolvedValue({ _id: 'company-1', name: 'Ada Tours' });

      const res = await request(app).get('/api/company/company-1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, company: { name: 'Ada Tours' } });
    });
  });

  describe('search', () => {
    test('requires a query parameter', async () => {
      const res = await request(app).get('/api/search');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Search query is required');
      expect(Company.find).not.toHaveBeenCalled();
    });

    test('escapes a regex metacharacter instead of crashing', async () => {
      const res = await request(app).get('/api/search?query=%5B');

      expect(res.status).toBe(200);
      const filter = Company.find.mock.calls[0][0];
      const pattern = filter.$or[0].name;
      expect(pattern.test('a[b')).toBe(true);
      expect(pattern.test('ab')).toBe(false);
    });

    test('returns the matching companies', async () => {
      Company.find.mockReturnValue(findResult([{ _id: 'company-1', name: 'Ada Tours' }]));

      const res = await request(app).get('/api/search?query=ada');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true });
      expect(res.body.companies).toHaveLength(1);
    });
  });

  describe('registry', () => {
    test('GET /api/companies requires a token', async () => {
      const res = await request(app).get('/api/companies');

      expect(res.status).toBe(401);
    });

    test('GET /api/companies requires the admin role', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${companyToken()}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ADMIN_REQUIRED');
    });

    test('GET /api/companies answers the registry for an admin', async () => {
      Company.find.mockReturnValue(findResult([{ _id: 'company-1' }, { _id: 'company-2' }]));

      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.companies).toHaveLength(2);
    });

    test('the /company/auth prefix serves the same handlers', async () => {
      Company.find.mockReturnValue(findResult([{ _id: 'company-1' }]));

      const res = await request(app)
        .get('/company/auth/companies')
        .set('Authorization', `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.companies).toHaveLength(1);
    });
  });

  describe('profile update', () => {
    test('PUT /api/update requires a token', async () => {
      const res = await request(app).put('/api/update').send({ name: 'New name' });

      expect(res.status).toBe(401);
    });

    test('PUT /api/update saves the provided fields', async () => {
      const company = {
        _id: 'company-1',
        name: 'Old name',
        email: 'old@x.io',
        phone: '123',
        save: jest.fn(),
      };
      Company.findById.mockResolvedValue(company);

      const res = await request(app)
        .put('/api/update')
        .set('Authorization', `Bearer ${companyToken()}`)
        .send({ name: 'New name', phone: '456' });

      expect(res.status).toBe(200);
      expect(company.name).toBe('New name');
      expect(company.phone).toBe('456');
      expect(company.email).toBe('old@x.io');
      expect(company.save).toHaveBeenCalled();
      expect(res.body.user).toMatchObject({ name: 'New name', phone: '456' });
    });

    test('PUT /api/update answers 404 when the company is gone', async () => {
      Company.findById.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/update')
        .set('Authorization', `Bearer ${companyToken()}`)
        .send({ name: 'New name' });

      expect(res.status).toBe(404);
    });

    test('rejects a malformed profile field before loading the company', async () => {
      const res = await request(app)
        .put('/api/update')
        .set('Authorization', `Bearer ${companyToken()}`)
        .send({ name: 42 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('"name" must be a string');
      expect(Company.findById).not.toHaveBeenCalled();
    });
  });

  describe('profile info', () => {
    test('PATCH /api/update-info writes allow-listed fields only', async () => {
      Company.findById.mockResolvedValue({
        _id: 'company-1',
        verificationStatus: 'Not Verified',
      });
      Company.findByIdAndUpdate.mockResolvedValue({ _id: 'company-1', name: 'New name' });

      const res = await request(app)
        .patch('/api/update-info')
        .set('Authorization', `Bearer ${companyToken()}`)
        .send({ name: 'New name', description: 'Small group trips', isVerified: true, __v: 9 });

      expect(res.status).toBe(200);
      expect(Company.findByIdAndUpdate).toHaveBeenCalledWith(
        'company-1',
        { name: 'New name', description: 'Small group trips' },
        { new: true }
      );
    });

    test('PATCH /api/update-info refuses a second pending license request', async () => {
      Company.findById.mockResolvedValue({ _id: 'company-1', verificationStatus: 'pending' });

      const res = await request(app)
        .patch('/api/update-info')
        .set('Authorization', `Bearer ${companyToken()}`)
        .send({ verificationStatus: 'pending' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('License request already pending.');
      expect(Company.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('PATCH /api/update-info rejects an empty update', async () => {
      Company.findById.mockResolvedValue({ _id: 'company-1', verificationStatus: 'approved' });

      const res = await request(app)
        .patch('/api/update-info')
        .set('Authorization', `Bearer ${companyToken()}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('No valid fields provided for update.');
    });
  });

  describe('admin verification decision', () => {
    test('PATCH /company/auth/update-status updates the company named in the body', async () => {
      Company.findByIdAndUpdate.mockResolvedValue({
        _id: 'company-2',
        verificationStatus: 'approved',
      });

      const res = await request(app)
        .patch('/company/auth/update-status')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ companyId: 'company-2', verificationStatus: 'approved', isVerified: true });

      expect(res.status).toBe(200);
      expect(Company.findByIdAndUpdate).toHaveBeenCalledWith(
        'company-2',
        { verificationStatus: 'approved', isVerified: true },
        { new: true }
      );
    });

    test('PATCH /company/auth/update-status rejects an unknown status', async () => {
      const res = await request(app)
        .patch('/company/auth/update-status')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ companyId: 'company-2', verificationStatus: 'verified-ish' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Unknown verification status');
      expect(Company.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('PATCH /company/auth/update-status refuses a non-admin token', async () => {
      const res = await request(app)
        .patch('/company/auth/update-status')
        .set('Authorization', `Bearer ${companyToken()}`)
        .send({ companyId: 'company-2', verificationStatus: 'approved' });

      expect(res.status).toBe(403);
      expect(Company.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('PATCH /company/auth/update-status needs a company id', async () => {
      const res = await request(app)
        .patch('/company/auth/update-status')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ verificationStatus: 'approved' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('No companyId provided');
    });
  });
});
