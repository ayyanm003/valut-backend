import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOtpMail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your account",
    html: `<h2>Your OTP is: ${otp}</h2>`
  });
};

export default sendOtpMail;