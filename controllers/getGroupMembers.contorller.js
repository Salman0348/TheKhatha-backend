const { dbQuery } = require("../utils/db");

const getGroupMembers = async (req, res) => {
  const groupIds = req.body?.groupIds;
  if (!groupIds) {
    return res.status(401).json({
      error: "GROUPS_IDS_REQUIRED",
      message: "Groups ids array is required",
    });
  }
  const groupIdsPlaceholders = groupIds.map(() => "?").join(",");

  try {
    const getGroupMembersSelectQuery = `SELECT 
    g.id AS group_id,
    CONCAT(
        '[',
        GROUP_CONCAT(
            JSON_OBJECT(
                'member_id', m.id,
                'member_name', u.username,
                'user_id', u.id,
                'member_pic_url', u.avatar_url,
                'member_amount_owed', m.amount_owed,
                'member_last_entry_purpose', e.purpose,
                'member_last_entry_amount', e.amount,
                'member_last_entry_time',DATE_FORMAT(e.created_at, '%Y-%m-%dT%H:%i:%sZ'),
                'member_last_entry_description', e.description
            )
            SEPARATOR ','
        ),
        ']'
    ) AS group_members
    FROM \`group\` g
    JOIN member m ON g.id = m.group_id
    JOIN user u ON m.user_id = u.id
    LEFT JOIN entry e ON m.id = e.member_id
        AND e.id = (
            SELECT e2.id 
            FROM entry e2 
            WHERE e2.member_id = m.id 
            ORDER BY e2.created_at DESC 
            LIMIT 1
        )
    WHERE g.id IN (${groupIdsPlaceholders}) 
    GROUP BY g.id;`;
    const groupsMembersResults = await dbQuery(
      getGroupMembersSelectQuery,
      groupIds
    );
    res.status(200).json({ groupsMembersResults });
  } catch (error) {
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      errorDetail: error,
    });
  }
};

module.exports = getGroupMembers;
