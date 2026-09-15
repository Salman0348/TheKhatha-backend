const nodemailer = require("nodemailer");
const logger = require("../configs/winstonLoggerConfig");

const nodemailerSendVerificationEmail = async (email, verificationToken) => {
  try {
    console.log("Creating Gmail transporter...");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_APP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    console.log("Gmail transporter created");
    console.log("Testing SMTP connection...");

    await transporter.verify();

    console.log("SMTP connection verified successfully");

    const mailOptions = {
      from: `TheKhatha <${process.env.EMAIL}>`,
      to: email,
      subject: "Email Verification",
      html: `
        <p>Dear user,</p>

        <p>
          Welcome to TheKhatha! Please verify your email by clicking
          the button below to complete your account creation:
        </p>

        <a
          href="${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}"
          style="
            display: inline-block;
            padding: 10px 20px;
            font-size: 16px;
            color: white;
            background-color: #4CAF50;
            text-decoration: none;
            border-radius: 5px;
          "
        >
          Verify Email
        </a>

        <p style="color: red">
          If you did not request this, please ignore this email.
        </p>

        <p style="font-size: 12px; color: #888;">
          This email was sent to you as part of the Khatha account creation process.
        </p>

        <p style="font-size: 12px; color: #888;">
          Thank you for choosing TheKhatha!
        </p>
      `,
    };

    console.log("Sending verification email...");

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);

    logger.info(
      `Verification email sent successfully to email:${email},at:${new Date().toISOString()}`,
    );

    return info;
  } catch (error) {
    console.error("========== EMAIL ERROR ==========");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Command:", error.command);
    console.error("Response:", error.response);
    console.error("Response Code:", error.responseCode);
    console.error("Stack:", error.stack);
    console.error("================================");

    logger.error(
      `Failed to send verification email to email:${email}, error:${error.message}, code:${error.code}, command:${error.command}, response:${error.response}, at:${new Date().toISOString()}`,
    );

    // IMPORTANT:
    // Do not hide the original Nodemailer error while debugging.
    throw error;
  }
};

module.exports = nodemailerSendVerificationEmail;
