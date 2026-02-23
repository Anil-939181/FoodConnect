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
      console.log('Email sent successfully:', result.data.id);
      return result.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

const emailService = new EmailService();

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

  const html = `
    <h3>${message}</h3>
    <p>Your OTP is:</p>
    <h2 style="letter-spacing:2px">${otp}</h2>
    <p>This OTP expires in 10 minutes.</p>
  `;

  await emailService.sendEmail(to, subject, html);
}

async function sendCustomEmail({ to, subject, html }) {
  await emailService.sendEmail(to, subject, html);
}

module.exports = { sendOtpEmail, sendCustomEmail, emailService };
