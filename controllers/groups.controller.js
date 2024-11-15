const { dbQuery } = require("../utils/db");

const groupsFetchController = async (req, res) => {
  const { userId } = req.user;
  if (!userId) {
    return res
      .status(401)
      .json({ error: "USER_ID_REQUIRED", message: "User id is required" });
  }
  try {
    const selectGroupsQuery = ` SELECT
        g.id AS group_id,
        g.group_name,
        g.group_pic_url,
        g.admin_id,
        m.amount_owed AS user_amount_owed,
        u.username AS last_entry_user,
        u.id AS last_entry_user_id,
        le.amount AS last_entry_amount,
        le.purpose AS last_entry_purpose,
        DATE_FORMAT(le.created_at, '%Y-%m-%dT%H:%i:%sZ') AS last_entry_date
    FROM
        \`group\` g
    JOIN
        member m ON g.id = m.group_id
    LEFT JOIN
        entry le ON le.id = (
            SELECT e.id
            FROM entry e
            JOIN member lm ON e.member_id = lm.id
            WHERE lm.group_id = g.id
            ORDER BY e.created_at DESC
            LIMIT 1
        )
    LEFT JOIN
        user u ON u.id = (
            SELECT u2.id
            FROM user u2
            JOIN member lm2 ON u2.id = lm2.user_id
            WHERE lm2.id = le.member_id
            LIMIT 1
        )
    WHERE
        m.user_id = ?
    ORDER BY
        le.created_at DESC;`;
    const results = await dbQuery(selectGroupsQuery, [userId]);
    res.status(200).json({ results });
  } catch (error) {
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      errorDetail: error,
    });
  }
};

module.exports = groupsFetchController;
