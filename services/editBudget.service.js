const { dbQuery } = require("../utils/db");

const editBudgetService = async (userId, memberId, budget) => {
  const updateQuery = `
    UPDATE member
    SET budget = ?
    WHERE id = ?
    AND user_id = ?
  `;

  await dbQuery(updateQuery, [budget, memberId, userId]);

  const selectQuery = `
    SELECT 
      id AS member_id,
      group_id,
      user_id,
      budget
    FROM member
    WHERE id = ?
    AND user_id = ?
  `;

  const [member] = await dbQuery(selectQuery, [memberId, userId]);

  return member;
};

module.exports = { editBudgetService };
