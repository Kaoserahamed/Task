'use strict';

jest.mock('sib-api-v3-sdk', () => {
  const sendTransacEmail = jest.fn();
  const TransactionalEmailsApi = jest.fn(() => ({ sendTransacEmail }));
  TransactionalEmailsApi.__sendTransacEmail = sendTransacEmail;
  return {
    ApiClient: { instance: { authentications: { 'api-key': {} } } },
    TransactionalEmailsApi,
  };
});

const { MailService } = require('../../services/mail.service');
const sib = require('sib-api-v3-sdk');
const log = { warn: jest.fn(), error: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  sib.TransactionalEmailsApi.__sendTransacEmail.mockRejectedValue(new Error('SMTP down'));
});

describe('mail service', () => {
  test('does not load a provider when mail is not configured', async () => {
    const service = new MailService({
      config: { apis: { sendinblue: '' } },
      log,
    });

    await expect(
      service.sendPasswordReset({ to: 'a@b.c', resetUrl: 'https://app', token: 't' })
    ).resolves.toEqual({
      sent: false,
      reason: 'NOT_CONFIGURED',
    });
    expect(log.warn).toHaveBeenCalled();
  });

  test('reports a delivery failure without throwing to the caller', async () => {
    const service = new MailService({
      config: { apis: { sendinblue: 'configured' } },
      log,
    });
    await expect(
      service.sendPasswordReset({ to: 'a@b.c', resetUrl: 'https://app', token: 't' })
    ).resolves.toEqual({
      sent: false,
      reason: 'DELIVERY_FAILED',
    });
    expect(log.error).toHaveBeenCalled();
    expect(sib.TransactionalEmailsApi.__sendTransacEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: [{ email: 'a@b.c' }] })
    );
  });
});
