const { google } = require('googleapis');
const MailComposer = require('nodemailer/lib/mail-composer');

class EmailService {
  constructor() {
    if (!process.env.OAUTH_CLIENT_ID || process.env.OAUTH_CLIENT_ID.includes('your_client_id')) {
      throw new Error("Missing or placeholder OAUTH_CLIENT_ID in environment variables");
    }

    this.oauth2Client = new google.auth.OAuth2(
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLIENT_SECRET,
      'https://developers.google.com'
    );

    this.oauth2Client.setCredentials({
      refresh_token: process.env.OAUTH_REFRESH_TOKEN
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }


  async sendEmail(to, subject, htmlContent) {
    try {
      const mailOptions = {
        from: `FoodConnect <${process.env.OAUTH_EMAIL}>`,
        to: to,
        subject: subject,
        html: htmlContent,
        textEncoding: 'base64'
      };
      const mail = new MailComposer(mailOptions);
      const message = await mail.compile().build();
      const rawMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawMessage
        }
      });
      return result.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

const emailService = new EmailService();

const baseEmailTemplate = (title, content, type = 'default') => {
  let primaryColor = '#059669'; // Emerald-600 (default/approve/complete)
  let bgColor = '#ecfdf5'; // Emerald-50

  if (type === 'request') {
    primaryColor = '#3b82f6'; // Blue-500
    bgColor = '#eff6ff'; // Blue-50
  } else if (type === 'cancel') {
    primaryColor = '#ef4444'; // Red-500
    bgColor = '#fef2f2'; // Red-50
  } else if (type === 'otp') {
    primaryColor = '#8b5cf6'; // Violet-500
    bgColor = '#f5f3ff'; // Violet-50
  } else if (type === 'contact') {
    primaryColor = '#f59e0b'; // Amber-500
    bgColor = '#fffbeb'; // Amber-50
  }

  return `
<div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; background-color: #f9fafb; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: ${primaryColor}; margin: 0; font-size: 28px; letter-spacing: -0.5px;">FoodConnect</h1>
  </div>
  <div style="background-color: white; padding: 32px; border-radius: 12px; border: 1px solid #f3f4f6; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <h2 style="color: #111827; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid ${bgColor}; padding-bottom: 12px;">${title}</h2>
    <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      ${content}
    </div>
  </div>
  <div style="text-align: center; margin-top: 24px; color: #6b7280; font-size: 13px;">
    <p style="margin: 0;">Thank you for making a difference.</p>
    <p style="margin: 4px 0 0 0;">&copy; ${new Date().getFullYear()} FoodConnect. All rights reserved.</p>
  </div>
</div>
`;
};

async function sendOtpEmail({ to, otp, purpose }) {
  let subject = "";
  let message = "";

  switch (purpose) {
    case "VERIFY":
      subject = "Verify your email - OTP";
      message = "Use this OTP to verify your email address.";
      break;
    case "RESET":
      subject = "Reset your password - OTP";
      message = "Use this OTP to reset your password. If you didn't request this, please ignore this email.";
      break;
    case "UPDATE":
      subject = "Verify Profile Update - OTP";
      message = "Use this OTP to authorize changes to your account details.";
      break;
    case "DELETE":
      subject = "Confirm Account Deletion - OTP";
      message = "Use this OTP to confirm the DELETION of your FoodConnect account. This action cannot be undone.";
      break;
    default:
      subject = "Your FoodConnect OTP";
      message = "Use this OTP to complete your requested action.";
  }

  const htmlContent = `
    <p style="font-size: 16px;">${message}</p>
    <p style="font-size: 16px; margin-top: 24px;">Your OTP is:</p>
    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
      <h2 style="letter-spacing:4px; margin: 0; color: #111827; font-size: 32px;">${otp}</h2>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">This OTP expires in 10 minutes.</p>
  `;

  const html = baseEmailTemplate(subject, htmlContent, 'otp');

  await emailService.sendEmail(to, subject, html);
}

async function sendCustomEmail({ to, subject, html }) {
  await emailService.sendEmail(to, subject, html);
}

module.exports = { sendOtpEmail, sendCustomEmail, emailService, baseEmailTemplate };
