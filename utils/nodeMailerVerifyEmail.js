const nodemailer = require("nodemailer");
const logger = require("../configs/winstonLoggerConfig");

const nodemailerSendVerificationEmail = async (email, verificationToken) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_APP_PASS,
      },
    });

    const mailOptions = {
      from: `TheKhatha <${process.env.EMAIL}>`,
      to: email,
      subject: "Email Verification",
      text: "Hey how are you?",
      // html: `
      //   <p>Dear user,</p>
      //   <p>Welcome to TheKhatha! Please verify your email by clicking the button below to complete your account creation:</p>
      //   <a href="${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}"
      //      style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">
      //      Verify Email
      //   </a>
      //   <p style="color: red">If you did not request this, please ignore this email.</p>
      //   <p style="font-size: 12px; color: #888;">This email was sent to you as part of the Khatha account creation process.</p>
      //   <p style="font-size: 12px; color: #888;">Thank you for choosing TheKhatha!</p>
      // `,
    };

    await transporter.sendMail(mailOptions);

    logger.info(
      `Verification email sent successfully to email:${email},at:${new Date().toISOString()}`
    );
  } catch (error) {
    console.error("Failed to send verification email:", error);
    logger.error(
      `Failed to send verification email to email:${email},error:${error},at${new Date().toISOString()}`
    );
    throw new Error("Failed to send verification email");
  }
};

module.exports = nodemailerSendVerificationEmail;
