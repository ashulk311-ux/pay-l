const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter (configure based on your SMTP settings)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Send onboarding email to new joinee
 */
async function sendOnboardingEmail(email, data) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Welcome! Complete Your Onboarding',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to the Team!</h1>
            </div>
            <div class="content">
              <p>Dear ${data.employeeName},</p>
              <p>We're excited to have you join our team! To complete your onboarding process, please click the button below to access your onboarding form.</p>
              <p style="text-align: center;">
                <a href="${data.onboardingUrl}" class="button">Complete Onboarding</a>
              </p>
              <p>This link will expire on ${new Date(data.expiresAt).toLocaleDateString()}.</p>
              <p>If you have any questions, please don't hesitate to contact HR.</p>
              <p>Best regards,<br>HR Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Onboarding email sent to ${email}`);
    return { success: true };
  } catch (error) {
    logger.error('Send onboarding email error:', error);
    throw error;
  }
}

module.exports = {
  sendOnboardingEmail
};



