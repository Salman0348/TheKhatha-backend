const { dbQuery } = require("../utils/db");

const createGroup = async (req, res) => {
  const groupImageCloudinaryUrl = req.imgUrl || null;
  const user = req.user;
  const groupName = req.body?.groupName;
  let membersArray = req.body?.members;

  // Parse membersArray and validate it
  if (membersArray) {
    try {
      membersArray =
        typeof membersArray === "string"
          ? JSON.parse(membersArray)
          : membersArray;
      if (!Array.isArray(membersArray) || membersArray.length === 0) {
        return res.status(400).json({
          error: "EMPTY_MEMBERS_ARRAY",
          message: "At least select one member.",
        });
      }
    } catch (error) {
      return res.status(400).json({
        error: "INVALID_ARRAY_FORMAT",
        message: "Members data is not a valid array.",
      });
    }
  } else {
    return res.status(400).json({
      error: "MEMBERS_ARRAY_REQUIRED",
      message: "Members array is required.",
    });
  }

  // Validate group name
  if (!groupName || groupName.length > 30) {
    return res.status(400).json({
      error: "INVALID_GROUP_NAME",
      message: "Group name must be 1-30 characters long.",
    });
  }

  let isTransactionStarted = false;
  try {
    //CODE FOR IF THE MEMBERS ARRAY CONTAINS VALID USERS(:remaining)

    // Start a transaction
    await dbQuery("START TRANSACTION");
    isTransactionStarted = true;

    // Insert the group into the `group` table
    const groupInsertQuery =
      "INSERT INTO `group` (group_name, group_pic_url, admin_id) VALUES (?, ?, ?)";
    const createGroupResults = await dbQuery(groupInsertQuery, [
      groupName,
      groupImageCloudinaryUrl,
      user.userId,
    ]);

    const newlyInsertedGroupId = createGroupResults.insertId;

    // Insert members concurrently using Promise.all
    const memberInsertQuery =
      "INSERT INTO member (user_id, group_id) VALUES (?, ?)";
    await Promise.all(
      membersArray.map((member) =>
        dbQuery(memberInsertQuery, [member.id, newlyInsertedGroupId])
      )
    );

    // Commit the transaction after successful inserts
    await dbQuery("COMMIT");
    isTransactionStarted = false;

    res.status(200).json({
      message: "Group created successfully",
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    if (isTransactionStarted) {
      await dbQuery("ROLLBACK");
    }

    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      errorDetail: error.message || error,
    });
  }
};

module.exports = createGroup;
