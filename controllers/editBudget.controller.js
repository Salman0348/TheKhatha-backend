const { checkMemberShip } = require("../services/dbServices");
const { editBudgetService } = require("../services/editBudget.service");

const editBudgetController = async (req, res) => {
  const { userId } = req.user;
  const { memberId, budget } = req.body;

  //   validations************************************************
  if (!memberId || !budget) {
    return res.status(400).json({
      error: "member id and budget are required.",
    });
  }

  const isBudgetNull =
    budget === undefined || budget === null || budget === "null";
  const budgetNum = isBudgetNull ? null : Number(budget);

  if (!isBudgetNull && (!Number.isFinite(budgetNum) || budgetNum < 0)) {
    return res.status(400).json({
      error: "invalid budget.",
    });
  }

  // budgetNum is either `null` (valid, no budget) or a valid non-negative number
  try {
    // calling checkMembership db service
    const isMember = await checkMemberShip(userId, memberId);

    if (!isMember) {
      return res.status(403).json({
        error: "You are not a member.",
      });
    }

    //   **************************************************************
    // calling edit budget service

    const member = await editBudgetService(userId, memberId, budgetNum);

    return res.status(200).json({
      message: "Member details updated successfully.",
      member,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = editBudgetController;
