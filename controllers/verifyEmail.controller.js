const jwt = require("jsonwebtoken");
const { dbQuery } = require("../utils/db");

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      error: "TOKEN_REQUIRED",
      message: "Verification token is required",
    });
  }

  try {
    jwt.verify(token, process.env.JWT_VERIFICATION_TOKEN_SECRET_KEY);
    // Retrieve the user data from pending_user
    const results = await dbQuery(
      "SELECT * FROM pending_user WHERE verification_token = ?",
      [token]
    );

    if (results.length === 0) {
      return res.status(400).json({
        error: "INVALID_OR_EXPIRED_TOKEN",
        message: "Verification token is invalid or has expired",
      });
    }

    const userData = results[0];

    // Move the user data to the main user table
    await dbQuery(
      "INSERT INTO user (username, email, password) VALUES (?, ?, ?)",
      [userData.username, userData.email, userData.password]
    );

    // Delete the entry from pending_user
    await dbQuery("DELETE FROM pending_user WHERE email = ?", [userData.email]);

    res.status(200).json({
      message: "Email verified successfully. User created.",
    });
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return res.status(400).json({
        error: "INVALID_OR_EXPIRED_TOKEN",
        message: "Verification token is invalid or has expired",
      });
    }
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      errorDetail: error,
    });
  }
};

module.exports = verifyEmail;
