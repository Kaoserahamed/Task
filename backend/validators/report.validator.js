'use strict';

const { z } = require('zod');

/** The dashboard's tabs map one-to-one onto these values. */
const REPORT_TYPES = ['user', 'company'];

/** The triage flow: a report is filed pending, worked, then resolved. */
const REPORT_STATUSES = ['pending', 'in-progress', 'resolved'];

const REPORT_PRIORITIES = ['low', 'medium', 'high'];

const OBJECT_ID = /^[a-f\d]{24}$/i;

const trimmedText = (field, max) =>
  z
    .string({ error: `'${field}' must be a string` })
    .trim()
    .min(1, `'${field}' is required`)
    .max(max, `'${field}' must contain at most ${max} characters`);

/** `:id` in the status-change URL. */
const reportIdSchema = z.object({
  id: z.string('Report id must be a string').regex(OBJECT_ID, 'Report id must be a valid ObjectId'),
});

/**
 * The status transition body.
 *
 * `.strict()` rejects unknown keys so a caller cannot smuggle `priority` or
 * `title` through an endpoint documented as a status change.
 */
const reportStatusSchema = z
  .object({
    status: z.enum(REPORT_STATUSES, {
      error: `Status must be one of: ${REPORT_STATUSES.join(', ')}`,
    }),
  })
  .strict();

/** The filing body, used by tests and any future customer-facing endpoint. */
const reportCreateSchema = z.object({
  type: z.enum(REPORT_TYPES, { error: `Type must be one of: ${REPORT_TYPES.join(', ')}` }),
  title: trimmedText('title', 200),
  submittedBy: trimmedText('submittedBy', 120),
  submittedAgainst: trimmedText('submittedAgainst', 120),
  description: z
    .string({ error: "'description' must be a string" })
    .trim()
    .max(2000, "'description' must contain at most 2000 characters")
    .optional()
    .default(''),
  priority: z
    .enum(REPORT_PRIORITIES, { error: `Priority must be one of: ${REPORT_PRIORITIES.join(', ')}` })
    .optional()
    .default('medium'),
  date: z.union([z.string(), z.date(), z.number()]).pipe(z.coerce.date()).optional(),
});

module.exports = {
  reportIdSchema,
  reportStatusSchema,
  reportCreateSchema,
  REPORT_TYPES,
  REPORT_STATUSES,
  REPORT_PRIORITIES,
};
