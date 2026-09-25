'use strict';

const { z } = require('zod');

const OBJECT_ID = /^[a-f\d]{24}$/i;
const PAYMENT_METHODS = ['credit-card', 'paypal', 'bank-transfer'];

const trimmedText = (field, { min = 1, max = 200 } = {}) =>
  z
    .string({ error: `'${field}' must be a string` })
    .trim()
    .min(min, `'${field}' must contain at least ${min} character${min === 1 ? '' : 's'}`)
    .max(max, `'${field}' must contain at most ${max} characters`);

const optionalText = (field, max = 200) =>
  z
    .string({ error: `'${field}' must be a string` })
    .trim()
    .max(max, `'${field}' must contain at most ${max} characters`)
    .optional()
    .default('');

const numericInput = (field, max) =>
  z
    .union([
      z
        .string({ error: `'${field}' must be a number` })
        .trim()
        .min(1),
      z
        .number({ error: `'${field}' must be a number` })
        .finite()
        .max(max),
    ])
    .pipe(z.coerce.number().finite().max(max));

const bookingCreateSchema = z
  .object({
    tourId: z
      .string('Tour ID must be a string')
      .regex(OBJECT_ID, 'Tour ID must be a valid ObjectId'),
    firstName: trimmedText('firstName', { max: 80 }),
    lastName: trimmedText('lastName', { max: 80 }),
    phone: trimmedText('phone', { max: 30 }),
    address: trimmedText('address', { max: 200 }),
    city: trimmedText('city', { max: 100 }),
    country: trimmedText('country', { max: 100 }),
    travelers: numericInput('Travelers', 100).pipe(
      z
        .number()
        .int('Travelers must be a whole number')
        .positive('Travelers must be greater than zero')
    ),
    startDate: z
      .union([
        z.string({ error: 'Start date must be a date' }).trim().min(1),
        z.date({ error: 'Start date must be a date' }),
        z.number({ error: 'Start date must be a date' }).finite(),
      ])
      .pipe(z.coerce.date('Start date must be a valid date')),
    specialRequests: optionalText('specialRequests', 1000),
    paymentMethod: z.enum(PAYMENT_METHODS, {
      error: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`,
    }),
    cardHolder: optionalText('cardHolder', 100),
    cardNumber: z
      .string({ error: 'Card number must be a string' })
      .trim()
      .optional()
      .transform((value) => value?.replace(/[\s-]/g, ''))
      .pipe(
        z
          .string()
          .regex(/^\d{12,19}$/, 'Card number must contain 12 to 19 digits')
          .optional()
          .or(z.literal(''))
      ),
  })
  .strict()
  .superRefine((booking, context) => {
    if (booking.paymentMethod !== 'credit-card') return;
    if (!booking.cardHolder) {
      context.addIssue({
        code: 'custom',
        path: ['cardHolder'],
        message: 'Card holder is required',
      });
    }
    if (!booking.cardNumber) {
      context.addIssue({
        code: 'custom',
        path: ['cardNumber'],
        message: 'Card number is required',
      });
    }
  });

module.exports = {
  bookingCreateSchema,
  PAYMENT_METHODS,
};
