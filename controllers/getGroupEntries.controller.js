const { dbQuery } = require("../utils/db");

const getGroupEntries = async (req, res) => {
  const { selectedGroupId } = req?.query;
  if (!selectedGroupId) {
    return res.status(401).json({
      error: "GROUP_ID_REQUIRED",
      message: "Selected group id is required",
    });
  }

  try {
    const getGroupHistorySelectQuery = `
    SELECT 
        e.id, 
        e.entry_no,
        e.amount AS entry_amount,
        e.purpose AS entry_purpose,
        e.description AS entry_description,
        e.created_at AS entry_date,
        e.updated_at AS entry_updated_date,
        m.user_id,
        u.username AS entry_person,
        GROUP_CONCAT(ep.member_id) AS participant_member_ids
    FROM 
        entry e
    JOIN 
        member m ON e.member_id = m.id
    JOIN 
        user u ON m.user_id = u.id
    LEFT JOIN
        entry_participant ep ON ep.entry_id = e.id
    WHERE 
        m.group_id = ?  
    GROUP BY 
        e.id, e.entry_no, e.amount, e.purpose, e.description, 
        e.created_at, e.updated_at, m.user_id, u.username
    ORDER BY 
        e.entry_no;
`;

    const results = await dbQuery(getGroupHistorySelectQuery, [
      selectedGroupId,
    ]);
    res.status(200).json({ results });
  } catch (error) {
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      errorDetail: error,
    });
  }
};

module.exports = getGroupEntries;
