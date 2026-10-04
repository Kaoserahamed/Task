'use strict';

const Report = require('../../models/Report');

test('constrains type, status and priority to the values the dashboard can render', () => {
  expect(Report.schema.path('type').enumValues).toEqual(['user', 'company']);
  expect(Report.schema.path('status').enumValues).toEqual(['pending', 'in-progress', 'resolved']);
  expect(Report.schema.path('priority').enumValues).toEqual(['low', 'medium', 'high']);

  // The tabs and the empty-filter pass in `reportFilters.js` compare against
  // these literals, so the model defaults have to agree with them.
  expect(Report.schema.path('status').defaultValue).toBe('pending');
  expect(Report.schema.path('priority').defaultValue).toBe('medium');
  expect(Report.schema.path('date').defaultValue).toEqual(expect.any(Function));
});

test('requires the fields a report card renders', () => {
  for (const field of ['type', 'title', 'submittedBy', 'submittedAgainst']) {
    expect(Report.schema.path(field).isRequired).toBe(true);
  }
  // Mongoose omits `isRequired` entirely when a field is not required, so this
  // asserts the field is optional without asserting a literal `false`.
  expect(Report.schema.path('description').isRequired).toBeFalsy();
  expect(Report.schema.path('title').options.maxlength).toBe(200);
});

test('indexes the two filters the moderation queue actually runs', () => {
  const indexes = Report.schema.indexes().map(([fields]) => fields);

  expect(indexes).toContainEqual({ status: 1, date: -1 });
  expect(indexes).toContainEqual({ type: 1, date: -1 });
});

test('rejects a report with a type or status outside the enums', () => {
  const valid = new Report({
    type: 'user',
    title: 'Poor service',
    submittedBy: 'Rahul Ahmed',
    submittedAgainst: 'Travel Buddy Ltd',
  });

  expect(valid.validateSync()).toBeUndefined();

  const badType = new Report({
    type: 'guide',
    title: 'Poor service',
    submittedBy: 'Rahul Ahmed',
    submittedAgainst: 'Travel Buddy Ltd',
  });
  expect(badType.validateSync().errors.type).toBeDefined();

  const badStatus = new Report({
    type: 'user',
    status: 'closed',
    title: 'Poor service',
    submittedBy: 'Rahul Ahmed',
    submittedAgainst: 'Travel Buddy Ltd',
  });
  expect(badStatus.validateSync().errors.status).toBeDefined();
});
