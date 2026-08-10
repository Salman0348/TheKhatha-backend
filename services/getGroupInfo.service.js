const { dbQuery } = require("../utils/db");

const getGroupInfoService = async (userId, memberId) => {
  // Get selected member's budget
  const selectBudgetQuery = `
    SELECT
      id AS member_id,
      group_id,
      user_id,
      budget
    FROM member
    WHERE id = ? AND user_id = ?;
  `;

  const [member] = await dbQuery(selectBudgetQuery, [memberId, userId]);

  if (!member) {
    throw new Error("Member not found.");
  }

  // Get all group members with their account details
  const membersAccountQuery = `
    SELECT
      m.id AS member_id,
      u.id AS user_id,
      u.username,
      ua.account_type,
      ua.account_title,
      ua.account_number
    FROM member m
    JOIN user u
      ON m.user_id = u.id
    LEFT JOIN user_account ua
      ON ua.user_id = u.id
    WHERE m.group_id = ?
    ORDER BY u.username;
  `;

  const membersAccountDetailsList = await dbQuery(membersAccountQuery, [
    member.group_id,
  ]);

  return {
    budgetInfo: member,
    membersAccountDetailsList,
  };
};

module.exports = { getGroupInfoService };
