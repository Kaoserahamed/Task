'use strict';

const {
  reportIdSchema,
  reportStatusSchema,
  reportCreateSchema,
  REPORT_STATUSES,
} = require('../../validators/report.validator');

describe('report status schema', () => {
  test('accepts every status in the triage flow', () => {
    for (const status of REPORT_STATUSES) {
      expect(reportStatusSchema.safeParse({ status }).success).toBe(true);
    }
  });

  test('rejects an unknown status with the allowed set in the message', () => {
    const result = reportStatusSchema.safeParse({ status: 'closed' });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('pending, in-progress, resolved');
  });

  test('rejects unknown fields so a status change cannot rewrite the report', () => {
    const result = reportStatusSchema.safeParse({ status: 'resolved', priority: 'low' });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].code).toBe('unrecognized_keys');
  });
});

describe('report id schema', () => {
  test('accepts a 24-character hex id and trims nothing else', () => {
    expect(reportIdSchema.safeParse({ id: '64b7f2c4a1b2c3d4e5f60718' }).success).toBe(true);
  });

  test.each([['nope'], ['64b7f2c4a1b2c3d4e5f6071'], ['']])('rejects %p as an identifier', (id) => {
    expect(reportIdSchema.safeParse({ id }).success).toBe(false);
  });
});

describe('report create schema', () => {
  const filing = {
    type: 'user',
    title: '  Poor service  ',
    submittedBy: ' Rahul Ahmed ',
    submittedAgainst: 'Travel Buddy Ltd',
  };

  test('trims the display fields and defaults the optional ones', () => {
    const result = reportCreateSchema.parse(filing);

    expect(result.title).toBe('Poor service');
    expect(result.submittedBy).toBe('Rahul Ahmed');
    expect(result.priority).toBe('medium');
    expect(result.description).toBe('');
    expect(result.date).toBeUndefined();
  });

  test('coerces a supplied date into a Date', () => {
    const result = reportCreateSchema.parse({ ...filing, date: '2023-05-15' });

    expect(result.date).toBeInstanceOf(Date);
  });

  test('requires a filing type and both parties', () => {
    expect(reportCreateSchema.safeParse({ ...filing, type: 'guide' }).success).toBe(false);
    expect(reportCreateSchema.safeParse({ ...filing, submittedAgainst: '  ' }).success).toBe(false);
  });

  test('caps the free-text fields at the model limits', () => {
    expect(reportCreateSchema.safeParse({ ...filing, title: 'x'.repeat(201) }).success).toBe(false);
    expect(reportCreateSchema.safeParse({ ...filing, description: 'x'.repeat(2001) }).success).toBe(
      false
    );
  });
});
