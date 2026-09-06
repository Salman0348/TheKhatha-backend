const { dbQuery } = require("../utils/db");

// Get all messages for a group
const getMessages = async (req, res) => {
  const user = req.user;
  const groupId = req.params.groupId;

  try {
    // Verify that the logged-in user is a member of this group
    const memberQuery = `
      SELECT id
      FROM member
      WHERE user_id = ?
      AND group_id = ?
    `;

    const members = await dbQuery(memberQuery, [user.userId, groupId]);

    if (members.length === 0) {
      return res.status(403).json({
        error: "NOT_GROUP_MEMBER",
        message: "You are not a member of this group.",
      });
    }

    const messagesQuery = `
      SELECT
        cm.id,
        cm.member_id,
        cm.message,
        cm.created_at,
        u.id AS user_id,
        u.username,
        u.avatar_url
      FROM chat_message cm
      JOIN member m ON cm.member_id = m.id
      JOIN user u ON m.user_id = u.id
      WHERE m.group_id = ?
      ORDER BY cm.created_at ASC
    `;

    const messages = await dbQuery(messagesQuery, [groupId]);

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      errorDetail: error.message || error,
    });
  }
};

// Send a new message
const sendMessage = async (req, res) => {
  const user = req.user;
  const groupId = req.params.groupId;
  const message = req.body?.message;

  if (!message || !message.trim()) {
    return res.status(400).json({
      error: "INVALID_MESSAGE",
      message: "Message cannot be empty.",
    });
  }

  try {
    // Find the member record of the logged-in user
    const memberQuery = `
      SELECT id
      FROM member
      WHERE user_id = ?
      AND group_id = ?
    `;

    const members = await dbQuery(memberQuery, [user.userId, groupId]);

    if (members.length === 0) {
      return res.status(403).json({
        error: "NOT_GROUP_MEMBER",
        message: "You are not a member of this group.",
      });
    }

    const memberId = members[0].id;

    const insertQuery = `
      INSERT INTO chat_message (member_id, message)
      VALUES (?, ?)
    `;

    const result = await dbQuery(insertQuery, [memberId, message.trim()]);

    // Return the newly created message
    const newMessageQuery = `
      SELECT
        cm.id,
        cm.member_id,
        cm.message,
        cm.created_at,
        u.id AS user_id,
        u.username,
        u.avatar_url
      FROM chat_message cm
      JOIN member m ON cm.member_id = m.id
      JOIN user u ON m.user_id = u.id
      WHERE cm.id = ?
    `;

    const newMessage = await dbQuery(newMessageQuery, [result.insertId]);

    res.status(201).json(newMessage[0]);
  } catch (error) {
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      errorDetail: error.message || error,
    });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  const user = req.user;
  const groupId = req.params.groupId;

  try {
    const query = `
      SELECT COUNT(*) AS unreadCount
      FROM chat_message cm
      JOIN member m ON cm.member_id = m.id
      WHERE m.group_id = ?
      AND cm.created_at > COALESCE(
        (
          SELECT last_chat_read_at
          FROM member
          WHERE user_id = ?
          AND group_id = ?
        ),
        '1970-01-01'
      )
    `;

    const result = await dbQuery(query, [groupId, user.userId, groupId]);

    res.status(200).json({
      unreadCount: Number(result[0].unreadCount),
    });
  } catch (error) {
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      errorDetail: error.message || error,
    });
  }
};

// Mark chat as read
const markChatAsRead = async (req, res) => {
  const user = req.user;
  const groupId = req.params.groupId;

  try {
    // Make sure the user belongs to this group
    const memberQuery = `
      SELECT id
      FROM member
      WHERE user_id = ?
      AND group_id = ?
    `;

    const members = await dbQuery(memberQuery, [user.userId, groupId]);

    if (members.length === 0) {
      return res.status(403).json({
        error: "NOT_GROUP_MEMBER",
        message: "You are not a member of this group.",
      });
    }

    const updateQuery = `
      UPDATE member
      SET last_chat_read_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
      AND group_id = ?
    `;

    await dbQuery(updateQuery, [user.userId, groupId]);

    res.status(200).json({
      message: "Chat marked as read.",
    });
  } catch (error) {
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      errorDetail: error.message || error,
    });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  getUnreadCount,
  markChatAsRead,
};
