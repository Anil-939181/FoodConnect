const nodemailer = require("nodemailer");

let transporter = null;
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error(
    "Missing SMTP credentials: set EMAIL_USER and EMAIL_PASS in your environment. Emails will not be sent."
  );
} else {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}
async function sendOtpEmail({ to, otp, purpose }) {
  if (!transporter) {
    throw new Error("Missing SMTP credentials: set EMAIL_USER and EMAIL_PASS");
  }
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

  await transporter.sendMail({
    from: `FoodConnect <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <h3>${message}</h3>
      <p>Your OTP is:</p>
      <h2 style="letter-spacing:2px">${otp}</h2>
      <p>This OTP expires in 10 minutes.</p>
    `
  });
}
async function sendCustomEmail({ to, subject, html }) {
  if (!transporter) {
    throw new Error("Missing SMTP credentials: set EMAIL_USER and EMAIL_PASS");
  }
  await transporter.sendMail({
    from: `FoodConnect <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

module.exports = { sendOtpEmail, sendCustomEmail };
