'use strict';

const request = require('supertest');

const createApp = require('../../app');
const reportRepository = require('../../repositories/report.repository');
const { signAccessToken } = require('../../utils/token');

jest.mock('../../repositories/report.repository');

const REPORT_ID = '64b7f2c4a1b2c3d4e5f60718';

const adminToken = () => signAccessToken('admin-1', { isAdmin: true, role: 'admin' });
const customerToken = () => signAccessToken('user-1');
const auth = (token) => ({ Authorization: `Bearer ${token}` });

const storedReport = (overrides = {}) => ({
  _id: REPORT_ID,
  type: 'user',
  title: 'Poor service during Cox’s Bazar tour',
  submittedBy: 'Rahul Ahmed',
  submittedAgainst: 'Travel Buddy Ltd',
  date: '2023-05-15T00:00:00.000Z',
  status: 'pending',
  priority: 'high',
  description: 'The tour guide was not knowledgeable.',
  ...overrides,
});

describe('reports HTTP surface', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    reportRepository.findAll.mockResolvedValue([storedReport()]);
    reportRepository.updateStatus.mockResolvedValue(storedReport({ status: 'in-progress' }));
  });

  test('refuses an anonymous or non-admin caller', async () => {
    const anonymous = await request(app).get('/api/reports');
    const customer = await request(app).get('/api/reports').set(auth(customerToken()));

    expect(anonymous.status).toBe(401);
    expect(customer.status).toBe(403);
    expect(reportRepository.findAll).not.toHaveBeenCalled();
  });

  test('lists reports newest-first as the flat shape the dashboard renders', async () => {
    const res = await request(app).get('/api/reports').set(auth(adminToken()));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      reports: [
        {
          id: REPORT_ID,
          type: 'user',
          title: 'Poor service during Cox’s Bazar tour',
          submittedBy: 'Rahul Ahmed',
          submittedAgainst: 'Travel Buddy Ltd',
          date: '2023-05-15T00:00:00.000Z',
          status: 'pending',
          priority: 'high',
          description: 'The tour guide was not knowledgeable.',
        },
      ],
    });
  });

  test('returns an empty list rather than failing when nothing has been filed', async () => {
    reportRepository.findAll.mockResolvedValue([]);

    const res = await request(app).get('/api/reports').set(auth(adminToken()));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, reports: [] });
  });

  test('moves a report to the requested status', async () => {
    const res = await request(app)
      .patch(`/api/reports/${REPORT_ID}/status`)
      .set(auth(adminToken()))
      .send({ status: 'in-progress' });

    expect(res.status).toBe(200);
    expect(res.body.report.status).toBe('in-progress');
    expect(reportRepository.updateStatus).toHaveBeenCalledWith(REPORT_ID, 'in-progress');
  });

  test('answers a typed 400 for an unknown status and a malformed id', async () => {
    const badStatus = await request(app)
      .patch(`/api/reports/${REPORT_ID}/status`)
      .set(auth(adminToken()))
      .send({ status: 'closed' });
    const badId = await request(app)
      .patch('/api/reports/not-an-id/status')
      .set(auth(adminToken()))
      .send({ status: 'resolved' });

    for (const res of [badStatus, badId]) {
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors.length).toBeGreaterThan(0);
    }
    expect(reportRepository.updateStatus).not.toHaveBeenCalled();
  });

  test('rejects unknown fields on a status change', async () => {
    const res = await request(app)
      .patch(`/api/reports/${REPORT_ID}/status`)
      .set(auth(adminToken()))
      .send({ status: 'resolved', title: 'rewritten' });

    expect(res.status).toBe(400);
    expect(reportRepository.updateStatus).not.toHaveBeenCalled();
  });

  test('answers a typed 404 when the report does not exist', async () => {
    reportRepository.updateStatus.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/reports/${REPORT_ID}/status`)
      .set(auth(adminToken()))
      .send({ status: 'resolved' });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, code: 'REPORT_NOT_FOUND' });
  });
});
