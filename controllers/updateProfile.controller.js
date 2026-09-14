const jwt = require("jsonwebtoken");
const { dbQuery } = require("../utils/db");
const bcrypt = require("bcrypt");

const updateProfile = async (req, res) => {
  const userNewImgUrl = req.imgUrl || null; // New image URL, from multer middleware
  const user = req.user; // Logged-in user info from auth middleware
  let newUsername = req.body?.newUsername || null; // New username, if provided
  if (newUsername) {
    newUsername = newUsername.trim();
  }
  const oldPassword = req.body?.oldPassword || null; // Old password, if provided
  const newPassword = req.body?.newPassword || null; // New password, if provided
  const isImgRemoved = req.body?.isImgRemoved === "true"; // Image removal flag, if provided
  if (newUsername && newUsername.length > 20) {
    return res.status(401).json({
      error: "NAME_LIMIT_EXCEEDED",
      message: "Username cannot exceed 20 characters",
    });
  }

  if (
    !userNewImgUrl &&
    !newUsername &&
    (!oldPassword || !newPassword) &&
    !isImgRemoved
  ) {
    return res.status(401).json({
      error: "FIELDS_REQUIRED",
      message: "To save changes, change at least one field",
    });
  }

  // Arrays to store the fields to update and it's parameters
  const updates = [];
  const params = [];

  // Dynamically add fields to the update array
  if (userNewImgUrl) {
    updates.push("avatar_url = ?");
    params.push(userNewImgUrl);
  }

  if (newUsername) {
    updates.push("username = ?");
    params.push(newUsername);
  }

  // If oldPassword and newPassword are provided, verify the old password
  if (oldPassword && newPassword) {
    try {
      // Fetch the current hashed password from the database
      const result = await dbQuery("SELECT password FROM user WHERE id = ?", [
        user.userId,
      ]);
      const currentHashedPassword = result[0].password;

      // Compare the provided old password with the current hashed password
      const isMatch = await bcrypt.compare(oldPassword, currentHashedPassword);

      if (!isMatch) {
        return res.status(403).json({
          error: "INVALID_OLD_PASSWORD",
          message: "The old password provided is incorrect",
        });
      }

      // If the old password matches, hash the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      updates.push("password = ?");
      params.push(hashedNewPassword);
    } catch (error) {
      return res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "An error occurred while verifying the old password",
        errorDetail: error,
      });
    }
  }

  if (isImgRemoved && !userNewImgUrl) {
    updates.push("avatar_url = NULL");
  }

  // Check if there are fields to update
  if (updates.length > 0) {
    const query = `
      UPDATE user
      SET ${updates.join(", ")}
      WHERE id = ?
    `;
    params.push(user.userId); // Adding the user's ID as the last parameter

    try {
      await dbQuery(query, params);

      const accessToken = jwt.sign(
        {
          userId: user.userId,
          username: newUsername || user.username,
          userEmail: user.userEmail,
          userPicCloudinayUrl: isImgRemoved
            ? null
            : userNewImgUrl || user.userPicCloudinayUrl,
        },
        process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
        { expiresIn: "15m" },
      );

      const refreshToken = jwt.sign(
        {
          userId: user.userId,
          username: newUsername || user.username,
          userEmail: user.userEmail,
          userPicCloudinayUrl: isImgRemoved
            ? null
            : userNewImgUrl || user.userPicCloudinayUrl,
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

      return res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
      return res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "An error occurred while updating the profile",
        errorDetail: error,
      });
    }
  } else {
    // If no fields are present, respond with a message
    return res.status(400).json({
      error: "FIELDS_REQUIRED",
      message: "To save changes, change at least one field",
    });
  }
};

module.exports = updateProfile;
