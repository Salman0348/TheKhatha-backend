const { dbQuery } = require("../utils/db");

const updateGroup = async (req, res) => {
  try {
    const {
      newGroupName: newGroupNameWithoutTrim = null,
      groupId,
      isImgRemoved: isImgRemovedString,
    } = req.body;
    const userId = req.user?.userId; // Logged-in user id: from auth middleware
    const newGroupName = newGroupNameWithoutTrim?.trim() || null;
    const imageFile = req.file || null;

    const isImgRemoved = isImgRemovedString === "true";
    const groupNewImgUrl = req.imgUrl || null;

    if (!groupId || !userId) {
      return res.status(401).json({
        error: "GROUP_ID_AND_USER_IDS_ARE_REQUIRED",
        message: "Group and user ids are required",
      });
    }
    if (
      newGroupNameWithoutTrim &&
      (!newGroupName || newGroupName.length > 30)
    ) {
      return res.status(401).json({
        error: "INVALID_GROUP_NAME",
        message: "Group name must be 1-30 characters long",
      });
    }
    if (!imageFile && !newGroupName && !isImgRemoved) {
      return res.status(401).json({
        error: "FIELDS_REQUIRED",
        message: "To save changes, change at least one field",
      });
    }

    // Check if the user is a member of the group
    const checkMembershipQuery = `
      SELECT COUNT(*) > 0 AS is_member 
      FROM member 
      WHERE user_id = ? 
      AND group_id = ?
    `;
    const [membershipResult] = await dbQuery(checkMembershipQuery, [
      userId,
      groupId,
    ]);

    if (!membershipResult.is_member) {
      return res.status(403).json({
        error: "NOT_A_MEMBER",
        message: "You are not authorized to update this group",
      });
    }

    // Arrays to store the fields to update and it's parameters
    const updates = [];
    const params = [];
    // Dynamically add fields to the update array
    if (groupNewImgUrl) {
      updates.push("group_pic_url = ?");
      params.push(groupNewImgUrl);
    }
    if (newGroupName) {
      updates.push("group_name = ?");
      params.push(newGroupName);
    }
    if (isImgRemoved && !groupNewImgUrl) {
      updates.push("group_pic_url = NULL");
    } // Check if there are fields to update
    if (updates.length > 0) {
      //no need for this check as there will be atleast one field in the updates b/c of the previous validations but I'm doing it for extra care
      const query = `
        UPDATE \`group\`
        SET ${updates.join(", ")}
        WHERE id = ?
      `;
      params.push(groupId); // Adding the group's ID as the last parameter

      await dbQuery(query, params);
      return res.status(200).json({ message: "Group updated successfully" });
    } else {
      // If no fields are present, respond with a message
      return res.status(401).json({
        error: "FIELDS_REQUIRED",
        message: "To save changes, change at least one field.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "An error occurred while updating the group",
      errorDetail: error,
    });
  }
};
module.exports = updateGroup;
