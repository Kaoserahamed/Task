'use strict';

const { ZodError } = require('zod');
const { ValidationError } = require('../utils/errors');

/**
 * Build Express middleware that validates one request location with a Zod schema.
 * Invalid input advances to the central error handler as a typed 400 instead of
 * reaching a controller or model.
 */
function validateRequest(schema, location = 'body') {
  if (!schema || typeof schema.safeParse !== 'function') {
    throw new TypeError('validateRequest requires a Zod schema');
  }

  if (!['body', 'query', 'params'].includes(location)) {
    throw new TypeError(`Unsupported validation location: ${location}`);
  }

  return function requestValidation(req, _res, next) {
    const result = schema.safeParse(req[location]);

    if (!result.success) {
      const errors = result.error.issues.flatMap((issue) => {
        if (issue.code === 'unrecognized_keys') {
          return issue.keys.map((field) => ({
            field,
            message: `Unrecognized field: "${field}"`,
          }));
        }

        return [
          {
            field: issue.path.join('.') || location,
            message: issue.message,
          },
        ];
      });
      return next(new ValidationError('Request validation failed', { errors }));
    }

    req[location] = result.data;
    return next();
  };
}

module.exports = validateRequest;
module.exports.ZodError = ZodError;
