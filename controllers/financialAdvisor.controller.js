const {
  getFinancialAdvisor,
} = require("../services/financialAdvisor.service.js");

const { checkGroupAccess } = require("../services/dbServices.js");

const getFinancialAdvisorController = async (req, res) => {
  const { userId } = req.user;
  const { groupId } = req.query;

  if (!groupId) {
    return res.status(400).json({
      error: "groupId is required",
    });
  }

  try {
    // Check if user belongs to the group
    const hasAccess = await checkGroupAccess(userId, groupId);

    if (!hasAccess) {
      return res.status(403).json({
        error: "Not a member: Access denied to this group",
      });
    }

    // get recommendations,
    const advisor = await getFinancialAdvisor(userId, groupId);

    return res.status(200).json({
      userId,

      groupId,

      advisor,
    });
  } catch (error) {
    console.error("Financial Advisor Error:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = getFinancialAdvisorController;
