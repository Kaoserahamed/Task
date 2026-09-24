'use strict';

const {
  AppError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
} = require('../../utils/errors');
const { classify } = require('../../middleware/errorHandler');

describe('error taxonomy', () => {
  test('AppError defaults to an operational 500', () => {
    const error = new AppError('boom');

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.isOperational).toBe(true);
    expect(error.message).toBe('boom');
  });

  test('AppError keeps the class name for log filtering', () => {
    expect(new NotFoundError().name).toBe('NotFoundError');
  });

  test.each([
    [BadRequestError, 400, 'VALIDATION_ERROR'],
    [ValidationError, 400, 'VALIDATION_ERROR'],
    [UnauthorizedError, 401, 'UNAUTHORIZED'],
    [ForbiddenError, 403, 'FORBIDDEN'],
    [NotFoundError, 404, 'NOT_FOUND'],
    [ConflictError, 409, 'CONFLICT'],
    [TooManyRequestsError, 429, 'RATE_LIMITED'],
  ])('%p carries status %i and code %s', (ErrorClass, status, code) => {
    const error = new ErrorClass();

    expect(error.status).toBe(status);
    expect(error.code).toBe(code);
    expect(error.isOperational).toBe(true);
  });

  test('toJSON produces the API envelope and hides details when absent', () => {
    expect(new NotFoundError('Tour not found').toJSON()).toEqual({
      success: false,
      error: 'Tour not found',
      code: 'NOT_FOUND',
    });
  });

  test('toJSON spreads details into the envelope', () => {
    const error = new ValidationError('Only 2 seats available', { availableSeats: 2 });

    expect(error.toJSON()).toEqual({
      success: false,
      error: 'Only 2 seats available',
      code: 'VALIDATION_ERROR',
      availableSeats: 2,
    });
  });
});

describe('error classification', () => {
  test('passes our own errors through untouched', () => {
    expect(classify(new ForbiddenError('nope', 'CORS_BLOCKED'))).toEqual({
      status: 403,
      code: 'CORS_BLOCKED',
      message: 'nope',
      details: undefined,
    });
  });

  test('maps a Mongoose validation error to a 400 with joined messages', () => {
    const mongooseError = new Error('Tour validation failed');
    mongooseError.name = 'ValidationError';
    mongooseError.errors = {
      name: { message: 'Path `name` is required.' },
      price: { message: 'Path `price` must be a number.' },
    };

    expect(classify(mongooseError)).toEqual({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Path `name` is required.; Path `price` must be a number.',
    });
  });

  test('maps a cast error to a 400 rather than a 500', () => {
    const castError = new Error('Cast to ObjectId failed');
    castError.name = 'CastError';
    castError.path = '_id';

    expect(classify(castError)).toEqual({
      status: 400,
      code: 'INVALID_IDENTIFIER',
      message: "Invalid value for '_id'",
    });
  });

  test('maps a duplicate key error to a 409', () => {
    const duplicate = new Error('E11000 duplicate key error');
    duplicate.code = 11000;

    expect(classify(duplicate)).toMatchObject({ status: 409, code: 'DUPLICATE_KEY' });
  });

  test('maps malformed JSON bodies to a 400', () => {
    const parseError = new Error('Unexpected token');
    parseError.type = 'entity.parse.failed';

    expect(classify(parseError)).toMatchObject({ status: 400, code: 'INVALID_JSON' });
  });

  test('maps oversized bodies and uploads to a 413', () => {
    expect(classify({ type: 'entity.too.large' })).toMatchObject({
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
    });
    expect(classify({ code: 'LIMIT_FILE_SIZE' })).toMatchObject({
      status: 413,
      code: 'FILE_TOO_LARGE',
    });
  });

  test('maps expired and invalid tokens to a 401', () => {
    const expired = new Error('jwt expired');
    expired.name = 'TokenExpiredError';
    const invalid = new Error('invalid signature');
    invalid.name = 'JsonWebTokenError';

    expect(classify(expired)).toMatchObject({ status: 401, code: 'TOKEN_EXPIRED' });
    expect(classify(invalid)).toMatchObject({ status: 401, code: 'INVALID_TOKEN' });
  });

  test('an unexpected error is an internal error, not a client error', () => {
    const failure = new TypeError('x is not a function');

    expect(classify(failure)).toEqual({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'x is not a function',
    });
  });
});
