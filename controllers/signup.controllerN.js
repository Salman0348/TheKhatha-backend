const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const nodemailerSendVerificationEmail = require("../utils/nodeMailerVerifyEmail");
const { dbQuery } = require("../utils/db");

const signup = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(401)
      .json({ error: "FIELDS_REQUIRED", message: "All fields are required" });
  }

  if (username.length > 20) {
    return res.status(401).json({
      error: "NAME_LIMIT_EXCEEDED",
      message: "Username cannot exceed 20 characters",
    });
  }

  try {
    // Check if user already exists
    const existingUser = await dbQuery("SELECT * FROM user WHERE email = ?", [
      email,
    ]);
    if (existingUser.length > 0) {
      return res
        .status(409)
        .json({ error: "USER_EXISTS", message: "User already exists" });
    }

    // Check if user already exists in pending_user table
    const pendingUser = await dbQuery(
      "SELECT * FROM pending_user WHERE email = ?",
      [email],
    );
    if (pendingUser.length > 0) {
      //if the user is already a pending user(pu) no need for creating another pu with the same email: so the code below this if won't be executed
      const oldVerificationToken = pendingUser[0].verification_token;
      // Generate a new verification token & update pending_user table if expired
      try {
        jwt.verify(
          oldVerificationToken,
          process.env.JWT_VERIFICATION_TOKEN_SECRET_KEY,
        );
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          const verificationToken = jwt.sign(
            { email },
            process.env.JWT_VERIFICATION_TOKEN_SECRET_KEY,
            { expiresIn: "1d" },
          );

          // Update the verification token in the database
          await dbQuery(
            "UPDATE pending_user SET verification_token = ? WHERE email = ?",
            [verificationToken, email],
          );
        } else {
          return res
            .status(500)
            .json({ message: error.message || "Internal server error" });
        }
      }

      return res.status(409).json({
        error: "USER_EXISTS_IN_PENDING_USER",
        message: "User already exists in pending_user",
      });
    }

    // Generate a verification token
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_VERIFICATION_TOKEN_SECRET_KEY,
      { expiresIn: "1d" },
    );

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user data in the pending_users table
    await dbQuery(
      "INSERT INTO pending_user (username, email, password, verification_token) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, verificationToken],
    );
    // Send verification email
    console.log("1. About to send verification email");

    await nodemailerSendVerificationEmail(email, verificationToken);

    console.log("2. Verification email sent");

    res.status(200).json({
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("SIGNUP ERROR:");
    console.error(error);
    console.error("Error code:", error.code);
    console.error("Error command:", error.command);
    console.error("Error response:", error.response);

    return res.status(500).json({
      error: "SIGNUP_ERROR",
      message: error.message || "Internal server error",
    });
  }
};

module.exports = signup;
