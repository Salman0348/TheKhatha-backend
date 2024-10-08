const { error } = require("winston");
const logger = require("../configs/winstonLoggerConfig");
const { dbQuery } = require("../utils/db");
const {
  groupDeleteEmailsSend,
} = require("../utils/groupDeleteEmailsSend.util");
const groupImgRemove = require("../utils/groupImgRemove.util");

const deleteGroup = async (req, res) => {
  console.log("delete group req");
  const userId = req.user?.userId; //from auth middleware
  const groupId = parseInt(req.params?.id);
  try {
    logger.info(
      `DELETE request made by user ID ${userId} for group ID ${groupId} at ${new Date().toISOString()}`
    );
  } catch (error) {}

  if (!groupId) {
    return res
      .status(401)
      .json({ error: "FIELD_REQUIRED", message: "Group ID is required" });
  }

  if (isNaN(groupId)) {
    return res
      .status(401)
      .json({ error: "INVALID_GROUP_ID", message: "Group ID is invalid" });
  }

  try {
    // Check if the group with this user as admin exists
    const checkMemberAdminshipQuery = `
      SELECT group_name,group_pic_url
      FROM \`group\` 
      WHERE id = ? 
      AND admin_id = ?
    `;
    const memberAdminshipResult = await dbQuery(checkMemberAdminshipQuery, [
      groupId,
      userId,
    ]);

    if (memberAdminshipResult.length === 0) {
      return res.status(403).json({
        error: "NO_GROUP_EXISTS",
        message: "No group with these credentials exists",
      });
    }

    const { group_name, group_pic_url } = memberAdminshipResult[0];

    const membersQuery =
      "SELECT u.id AS user_id, u.username, u.email, m.amount_owed FROM user u JOIN member m ON u.id = m.user_id WHERE group_id = ?";
    const membersResult = await dbQuery(membersQuery, [groupId]);

    //group deletion query
    const deleteQuery = "DELETE FROM `group` WHERE id = ?";
    await dbQuery(deleteQuery, [groupId]);

    const promises = [];
    //group_pic_url cloudinary img removing function
    if (group_pic_url) {
      promises.push(groupImgRemove(group_pic_url, groupId));
    }

    // email send to each member after successfull deletion
    promises.push(
      groupDeleteEmailsSend(membersResult, userId, { group_name, groupId })
    );
    //waiting aync functions for its concurrent execution
    await Promise.allSettled(promises);
    console.log(promises);

    logger.info(
      `Group deleted successfully,group ID:${groupId},requested by user ID:${userId},at:${new Date().toISOString()}`
    );
    return res.status(200).json({
      message: `successfull deletion of group "${group_name}"`,
      groupId,
      group_pic_url,
      membersResult,
    });
  } catch (error) {
    logger.error(
      `An error occurred while deleting the group with ID:${groupId}, requested user ID:${userId}, error:${error} at ${new Date().toISOString()}`
    );
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "An error occurred while deleting the group",
      errorDetail: error,
    });
  }
};
module.exports = deleteGroup;
