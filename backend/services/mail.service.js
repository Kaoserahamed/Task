'use strict';

const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Transactional email.
 *
 * The Sendinblue SDK is required lazily and only when a key is configured, so
 * the app boots — and the hermetic unit suite runs — without a mail provider.
 *
 * Delivery failures are logged and swallowed on purpose. The password-reset
 * endpoint must answer identically whether or not the address exists; if a
 * provider outage were allowed to fail the request, the response would become a
 * reliable oracle for "is this email registered?". The operator sees the error
 * in the log; the caller only learns that the request was accepted.
 */

const RESET_SUBJECT = 'Task - Password Reset Request';
const RESET_TTL_MINUTES = 60;

let sdk = null;

const loadSdk = () => {
  if (sdk) {
    return sdk;
  }
  const sibApiV3Sdk = require('sib-api-v3-sdk');
  const authentication = sibApiV3Sdk.ApiClient.instance.authentications['api-key'];
  authentication.apiKey = config.apis.sendinblue;
  sdk = { transactional: new sibApiV3Sdk.TransactionalEmailsApi() };
  return sdk;
};

const sender = {
  name: config.mail.fromName,
  email: config.mail.fromEmail,
};

const textBody = 'You requested a password reset for your Task account.';

const htmlBody = (resetUrl, token) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color:rgb(26, 101, 232); margin: 10px 0;">Task</h1>
    </div>
    <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #2d3748; margin-bottom: 20px;">Password Reset Request</h2>
      <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
        We received a request to reset your password for your Task account. Click the button below to set a new password:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}/${token}"
           style="background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #718096; font-size: 14px; margin-bottom: 20px;">
        This link will expire in ${RESET_TTL_MINUTES} minutes for security reasons.
      </p>
      <p style="color: #718096; font-size: 14px; margin-bottom: 0;">
        If you didn't request this password reset, you can safely ignore this email.
      </p>
    </div>
    <div style="text-align: center; margin-top: 30px; color: #718096; font-size: 12px;">
      <p>© 2024 Task. All rights reserved.</p>
    </div>
  </div>
`;

class MailService {
  constructor({ config: appConfig = config, log = logger } = {}) {
    this.config = appConfig;
    this.log = log;
  }

  get isConfigured() {
    return Boolean(this.config.apis.sendinblue);
  }

  /**
   * Send the password-reset link. Never throws: a provider failure must not
   * change the endpoint's response (see the module comment).
   */
  async sendPasswordReset({ to, resetUrl, token }) {
    if (!this.isConfigured) {
      this.log.warn('Password reset requested but no mail provider is configured; email not sent');
      return { sent: false, reason: 'NOT_CONFIGURED' };
    }

    try {
      const { transactional } = loadSdk();
      await transactional.sendTransacEmail({
        sender,
        to: [{ email: to }],
        subject: RESET_SUBJECT,
        textContent: textBody,
        htmlContent: htmlBody(resetUrl, token),
      });
      return { sent: true };
    } catch (error) {
      this.log.error('Password reset email could not be sent:', error);
      return { sent: false, reason: 'DELIVERY_FAILED' };
    }
  }
}

module.exports = new MailService();
module.exports.MailService = MailService;
