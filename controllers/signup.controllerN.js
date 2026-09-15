const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
      return res.status(409).json({
        error: "USER_EXISTS",
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    /*
     * DEVELOPMENT
     * ----------------------------------------
     * Use pending_user + email verification.
     */
    if (process.env.NODE_ENV == "development") {
      // Check if user already exists in pending_user
      const pendingUser = await dbQuery(
        "SELECT * FROM pending_user WHERE email = ?",
        [email],
      );

      if (pendingUser.length > 0) {
        const oldVerificationToken = pendingUser[0].verification_token;

        // Check whether old token is expired
        try {
          jwt.verify(
            oldVerificationToken,
            process.env.JWT_VERIFICATION_TOKEN_SECRET_KEY,
          );

          // Token is still valid
          return res.status(409).json({
            error: "USER_EXISTS_IN_PENDING_USER",
            message: "User already exists in pending_user",
          });
        } catch (error) {
          // Token expired -> generate a new one
          if (error.name === "TokenExpiredError") {
            const verificationToken = jwt.sign(
              { email },
              process.env.JWT_VERIFICATION_TOKEN_SECRET_KEY,
              { expiresIn: "1d" },
            );

            await dbQuery(
              "UPDATE pending_user SET verification_token = ? WHERE email = ?",
              [verificationToken, email],
            );

            await nodemailerSendVerificationEmail(email, verificationToken);

            return res.status(200).json({
              message: "Verification email sent successfully",
            });
          }

          return res.status(500).json({
            message: error.message || "Internal server error",
          });
        }
      }

      // Generate verification token
      const verificationToken = jwt.sign(
        { email },
        process.env.JWT_VERIFICATION_TOKEN_SECRET_KEY,
        { expiresIn: "1d" },
      );

      // Store user temporarily in pending_user
      await dbQuery(
        `INSERT INTO pending_user
        (username, email, password, verification_token)
        VALUES (?, ?, ?, ?)`,
        [username, email, hashedPassword, verificationToken],
      );

      // Send verification email
      await nodemailerSendVerificationEmail(email, verificationToken);

      return res.status(200).json({
        message: "Verification email sent successfully",
      });
    }

    /*
     * PRODUCTION
     * ----------------------------------------
     * Skip email verification.
     * Create user directly.
     */
    await dbQuery(
      `INSERT INTO user
  (username, email, password)
  VALUES (?, ?, ?)`,
      [username, email, hashedPassword],
    );

    return res.status(200).json({
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);

    if (error.message === "Failed to send verification email") {
      return res.status(500).json({
        error: "EMAIL_ERROR",
        message: "Failed to send verification email",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

module.exports = signup;
