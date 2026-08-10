const { dbQuery } = require("../utils/db");

const getExpenseAnalytics = async ({
  userId,
  groupId,
  type,
  period,
  startDateTime,
  endDateTime,
}) => {
  let periodExpression;

  switch (period) {
    case "hourly":
      periodExpression = "DATE_FORMAT(e.created_at, '%Y-%m-%d %H:00:00')";
      break;

    case "daily":
      periodExpression = "DATE_FORMAT(e.created_at, '%Y-%m-%d')";
      break;

    case "weekly":
      periodExpression =
        "DATE_SUB(DATE(e.created_at), INTERVAL WEEKDAY(e.created_at) DAY)";
      break;

    case "monthly":
      periodExpression = "DATE_FORMAT(e.created_at, '%Y-%m')";
      break;

    default:
      throw new Error("Invalid analytics period");
  }

  /*
    Each participant's responsibility is:

    entry.amount / total number of participants

    We only include entries where the logged-in
    user is a participant.
  */

  if (type === "overall") {
    const query = `
      SELECT
        ${periodExpression} AS period_key,

        SUM(
          e.amount /
          (
            SELECT COUNT(*)
            FROM entry_participant ep2
            WHERE ep2.entry_id = e.id
          )
        ) AS total_amount

      FROM entry e

      INNER JOIN member entry_member
        ON e.member_id = entry_member.id

      INNER JOIN entry_participant ep
        ON e.id = ep.entry_id

      INNER JOIN member participant_member
        ON ep.member_id = participant_member.id

      WHERE entry_member.group_id = ?
        AND participant_member.user_id = ?
        AND participant_member.group_id = ?
        AND e.created_at >= ?
        AND e.created_at <= ?

      GROUP BY ${periodExpression}

      ORDER BY period_key ASC
    `;

    return await dbQuery(query, [
      groupId,
      userId,
      groupId,
      startDateTime,
      endDateTime,
    ]);
  }

  /*
    Category-wise analytics
  */

  if (type === "category") {
    const query = `
      SELECT
        ${periodExpression} AS period_key,

        COALESCE(
          e.category,
          'Miscellaneous'
        ) AS category,

        SUM(
          e.amount /
          (
            SELECT COUNT(*)
            FROM entry_participant ep2
            WHERE ep2.entry_id = e.id
          )
        ) AS total_amount

      FROM entry e

      INNER JOIN member entry_member
        ON e.member_id = entry_member.id

      INNER JOIN entry_participant ep
        ON e.id = ep.entry_id

      INNER JOIN member participant_member
        ON ep.member_id = participant_member.id

      WHERE entry_member.group_id = ?
        AND participant_member.user_id = ?
        AND participant_member.group_id = ?
        AND e.created_at >= ?
        AND e.created_at <= ?

      GROUP BY
        ${periodExpression},
        COALESCE(
          e.category,
          'Miscellaneous'
        )

      ORDER BY
        period_key ASC,
        category ASC
    `;

    return await dbQuery(query, [
      groupId,
      userId,
      groupId,
      startDateTime,
      endDateTime,
    ]);
  }

  throw new Error("Invalid analytics type");
};

module.exports = {
  getExpenseAnalytics,
};
