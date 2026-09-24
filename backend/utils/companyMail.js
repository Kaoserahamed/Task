'use strict';

/**
 * Transactional email payloads for company accounts.
 *
 * The password-reset HTML used to sit inside the route next to the request
 * handling, which is why the route could not be touched without re-reading a
 * wall of markup. Keeping it here also makes the payload (and the reset link it
 * contains) directly testable.
 */

function passwordResetEmail({ sender, email, resetUrl = '', token }) {
  return {
    sender,
    to: [{ email }],
    subject: 'Task - Password Reset Request',
    textContent: 'You requested a password reset for your Task account.',
    htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 30px;">
              <i class="fas fa-globe-americas" style="font-size: 48px; color: #4299e1;"></i>
              <h1 style="color:rgb(18, 99, 239); margin: 10px 0;">Task</h1>
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
                This link will expire in 1 hour for security reasons.
              </p>

              <p style="color: #718096; font-size: 14px; margin-bottom: 0;">
                If you didn't request this password reset, you can safely ignore this email.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; color: #718096; font-size: 12px;">
              <p>© 2024 Task. All rights reserved.</p>
            </div>
          </div>
        `,
  };
}

module.exports = { passwordResetEmail };
