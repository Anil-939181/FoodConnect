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
  const subject =
    purpose === "VERIFY"
      ? "Verify your email - OTP"
      : "Reset your password - OTP";

  const message =
    purpose === "VERIFY"
      ? "Use this OTP to verify your email"
      : "Use this OTP to reset your password";

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
