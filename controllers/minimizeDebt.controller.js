const { dbQuery } = require("../utils/db");
const minimizeDebt = require("../services/debtMinimizer");

const minimizeDebtController = async (req, res) => {
  const { groupId } = req?.query;

  if (!groupId) {
    return res.status(400).json({
      error: "GROUP_ID_REQUIRED",
      message: "Group id is required",
    });
  }

  try {
    const sql = `
      SELECT 
        m.id AS member_id,
        u.id AS user_id,
        u.username AS member_name,
        m.amount_owed

      FROM member m

      JOIN user u
        ON m.user_id = u.id

      WHERE m.group_id = ?
    `;

    const results = await dbQuery(sql, [groupId]);

    const settlements = minimizeDebt(results, groupId);

    res.status(200).json({
      settlements,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  }
};

module.exports = minimizeDebtController;
