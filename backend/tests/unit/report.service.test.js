'use strict';

const { ReportService, toPublicReport } = require('../../services/report.service');
const { NotFoundError } = require('../../utils/errors');

const REPORT_ID = '64b7f2c4a1b2c3d4e5f60718';

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

const repository = () => ({
  findAll: jest.fn().mockResolvedValue([]),
  updateStatus: jest.fn().mockResolvedValue(storedReport()),
});

describe('report service', () => {
  test('returns the stored order untouched — sorting is the client selector’s job', async () => {
    const reports = repository();
    reports.findAll.mockResolvedValue([
      storedReport({ _id: 'r-2', title: 'Second' }),
      storedReport({ _id: 'r-1', title: 'First' }),
    ]);

    const result = await new ReportService({ reports }).list();

    expect(result.map((report) => report.title)).toEqual(['Second', 'First']);
  });

  test('exposes a flat public shape with a string id', async () => {
    const reports = repository();
    reports.findAll.mockResolvedValue([storedReport()]);

    const [report] = await new ReportService({ reports }).list();

    expect(report).toEqual({
      id: REPORT_ID,
      type: 'user',
      title: 'Poor service during Cox’s Bazar tour',
      submittedBy: 'Rahul Ahmed',
      submittedAgainst: 'Travel Buddy Ltd',
      date: '2023-05-15T00:00:00.000Z',
      status: 'pending',
      priority: 'high',
      description: 'The tour guide was not knowledgeable.',
    });
    expect(report).not.toHaveProperty('_id');
  });

  test('flattens a Mongoose document through toObject', () => {
    const document = { toObject: () => storedReport() };

    expect(toPublicReport(document).id).toBe(REPORT_ID);
  });

  test('defaults a missing description to an empty string', () => {
    const report = storedReport();
    delete report.description;

    expect(toPublicReport(report).description).toBe('');
  });

  test('tolerates an empty collection', async () => {
    expect(await new ReportService({ reports: repository() }).list()).toEqual([]);
  });

  test('returns the updated report after a status change', async () => {
    const reports = repository();
    reports.updateStatus.mockResolvedValue(storedReport({ status: 'in-progress' }));

    const result = await new ReportService({ reports }).updateStatus(REPORT_ID, 'in-progress');

    expect(reports.updateStatus).toHaveBeenCalledWith(REPORT_ID, 'in-progress');
    expect(result.status).toBe('in-progress');
  });

  test('answers a typed NOT_FOUND for an unknown report', async () => {
    const reports = repository();
    reports.updateStatus.mockResolvedValue(null);

    await expect(
      new ReportService({ reports }).updateStatus(REPORT_ID, 'resolved')
    ).rejects.toMatchObject({
      name: 'NotFoundError',
      status: 404,
      code: 'REPORT_NOT_FOUND',
    });

    await expect(
      new ReportService({ reports }).updateStatus(REPORT_ID, 'resolved')
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
