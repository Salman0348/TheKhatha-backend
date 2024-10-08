const jwt = require("jsonwebtoken");
const { dbQuery } = require("../utils/db");
const nodemailerSendVerificationEmail = require("../utils/nodeMailerVerifyEmail");

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: "EMAIL_REQUIRED",
      message: "Email address is required",
    });
  }

  try {
    // Check if user exists in the pending_user table
    const results = await dbQuery(
      "SELECT * FROM pending_user WHERE email = ?",
      [email]
    );

    if (results.length === 0) {
      return res.status(404).json({
        error: "USER_NOT_FOUND",
        message: "No pending verification found for this email",
      });
    }

    const userData = results[0];

    // Generate a new verification token
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_VERIFICATION_TOKEN_SECRET_KEY,
      { expiresIn: "1d" }
    );

    // Update the verification token in the database
    await dbQuery(
      "UPDATE pending_user SET verification_token = ? WHERE email = ?",
      [verificationToken, email]
    );

    // Send verification email
    await nodemailerSendVerificationEmail(email, verificationToken);
    res.status(200).json({
      message: "Verification email sent successfully",
    });
  } catch (error) {
    if (error.message === "Failed to send verification email") {
      return res.status(500).json({
        error: "EMAIL_ERROR",
        message: "Failed to send verification email",
      });
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

module.exports = resendVerificationEmail;
