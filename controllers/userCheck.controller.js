const { dbQuery } = require("../utils/db");

const userCheck = async (req, res) => {
  const userEmail = req.body.email;
  if (!userEmail) {
    return res
      .status(401)
      .json({ error: "EMAIL_REQUIRED", message: "Email is required" });
  }

  try {
    const results = await dbQuery(
      "SELECT id, username FROM user WHERE email = ?",
      [userEmail]
    );
    if (results.length === 0) {
      return res.status(401).json({
        error: "INVALID_EMAIL",
        message: "Invalid email",
      });
    }

    const user = results[0];
    res.status(200).json({ user: { id: user.id, username: user.username } });
  } catch (error) {
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      errorDetail: error,
    });
  }
};

module.exports = userCheck;
