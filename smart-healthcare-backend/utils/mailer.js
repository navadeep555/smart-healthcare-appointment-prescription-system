const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendOTPEmail(to, otp) {
  await transporter.sendMail({
    from: `"Smart Healthcare" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "Your OTP - Smart Healthcare",
    html: `
      <h2>OTP Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 5 minutes.</p>
    `
  });
}

module.exports = sendOTPEmail;
