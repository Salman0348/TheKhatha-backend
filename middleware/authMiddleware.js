const jwt = require("jsonwebtoken");
const { db } = require("../utils/db");

/**
 * middleware for authinticating the jwt access token and if it expires, renews it with refresh token
 */
const authinticateToken = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
  if (!(accessToken && refreshToken)) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "send access and refresh token",
    });
  }

  jwt.verify(
    accessToken,
    process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
    (err, user) => {
      //user is decoded info from the token
      if (err) {
        if (err.name === "TokenExpiredError") {
          jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
            (err, user) => {
              if (err) {
                return res.status(403).json({
                  error: "INVALID_TOKEN",
                  message: "Invalid refresh token access",
                });
              }

              db.query(
                "SELECT * FROM user WHERE id = ?",
                [user.userId],
                (err, results) => {
                  if (err) {
                    return res.status(500).json({
                      error: "INTERNAL_ERROR",
                      message: "Internal server error",
                    });
                  } else if (results.length === 0) {
                    return res.status(403).json({
                      error: "INVALID_TOKEN",
                      message: "Invalid acces token access",
                    });
                  }
                  const dbUser = results[0];
                  const newAccessToken = jwt.sign(
                    {
                      userId: dbUser.id,
                      username: dbUser.username,
                      userEmail: dbUser.email,
                      userPicCloudinayUrl: dbUser.avatar_url || null,
                    },
                    process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
                    { expiresIn: "15m" }
                  );
                  res.cookie("accessToken", newAccessToken, {
                    httpOnly: true,
                    // secure: true,
                    sameSite: "Strict",
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
                  });
                  req.user = {
                    userId: dbUser.id,
                    username: dbUser.username,
                    userEmail: dbUser.email,
                    userPicCloudinayUrl: dbUser.avatar_url || null,
                  };
                  next();
                }
              );
            }
          );
        } else {
          return res.status(403).json({
            error: "INVALID_TOKEN",
            message: "Invalid acces token access",
          });
        }
      } else {
        req.user = user;
        next();
      }
    }
  );
};

module.exports = authinticateToken;
