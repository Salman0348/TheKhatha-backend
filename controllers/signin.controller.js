const { db } = require("../utils/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const signin = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(401)
      .json({ error: "FIELDS_REQUIRED", message: "All fields are required" });
  }
  try {
    db.query("SELECT * FROM user WHERE email = ?", [email], (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "INTERNAL_ERROR", message: "Internal server error" });
      } else if (results.length === 0) {
        return res.status(401).json({
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        });
      }
      const user = results[0];
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({
            error: "INTERNAL_ERROR",
            message: "Internal server error",
          });
        }
        if (!isMatch) {
          return res.status(401).json({
            error: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          });
        }
        const accessToken = jwt.sign(
          {
            userId: user.id,
            username: user.username,
            userEmail: user.email,
            userPicCloudinayUrl: user.avatar_url,
          },
          process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
          { expiresIn: "15m" },
        );
        const refreshToken = jwt.sign(
          {
            userId: user.id,
            username: user.username,
            userEmail: user.email,
            userPicCloudinayUrl: user.avatar_url,
          },
          process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
          { expiresIn: "7d" },
        );

        const isProduction = process.env.NODE_ENV === "production";

        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        });

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        });

        res.status(200).json({ message: "Loged in successfully" });
      });
    });
  } catch (error) {
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  }
};

module.exports = signin;
