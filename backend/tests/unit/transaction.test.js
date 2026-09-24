'use strict';

const mongoose = require('mongoose');
const { runInTransaction } = require('../../utils/transaction');

jest.mock('mongoose', () => ({ startSession: jest.fn() }));

describe('transaction boundary', () => {
  test('runs the unit of work and always ends the session', async () => {
    const session = {
      withTransaction: jest.fn(async (work) => work()),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
    mongoose.startSession.mockResolvedValue(session);

    await expect(
      runInTransaction(async (activeSession) => `used-${activeSession === session}`)
    ).resolves.toBe('used-true');
    expect(session.withTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  test('ends the session when the unit of work fails', async () => {
    const failure = new Error('transaction failed');
    const session = {
      withTransaction: jest.fn().mockRejectedValue(failure),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
    mongoose.startSession.mockResolvedValue(session);

    await expect(runInTransaction()).rejects.toThrow('transaction failed');
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });
});
