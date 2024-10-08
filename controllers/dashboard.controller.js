const dashboard = (req, res) => {
  const { userId: id, username, userEmail, userPicCloudinayUrl } = req.user;
  res.json({
    user: { id, username, userEmail, userPicCloudinayUrl },
    message: "user is authinticated to dashboard",
  });
};

module.exports = dashboard;
