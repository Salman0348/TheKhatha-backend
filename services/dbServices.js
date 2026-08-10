const { dbQuery } = require("../utils/db");

const checkGroupAccess = async (userId, groupId) => {
  const query = `
    SELECT g.id
    FROM \`group\` g
    INNER JOIN member m 
      ON g.id = m.group_id
    WHERE g.id = ?
      AND m.user_id = ?
    LIMIT 1
  `;

  const result = await dbQuery(query, [groupId, userId]);

  return result.length > 0;
};
// check if a specific user is a specified meber
const checkMemberShip = async (userId, memberId) => {
  const query = `
    SELECT m.id
    FROM member m
    WHERE m.id = ?
      AND m.user_id = ?
    LIMIT 1
  `;

  const result = await dbQuery(query, [memberId, userId]);

  return result.length > 0;
};

module.exports = {
  checkGroupAccess,
  checkMemberShip,
};
