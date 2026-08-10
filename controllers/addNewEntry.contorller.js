const { isSubset, hasDuplicates } = require("../utils/arrayOperations.util");
const { dbQuery } = require("../utils/db");
const isNumeric = require("../utils/isNumeric.util");
const { getCategory } = require("../services/aiServices");

const addNewEntry = async (req, res) => {
  const {
    submittingMemberId,
    entryAmount: rawEntryAmount,
    entryPurpose,
    entryDescription,
    participantsIds, //will be null if no custom participants are selected
  } = req.body;

  const userId = req.user?.userId; //it must be present: the user is authinticated if the execution comes here
  let entryAmount = rawEntryAmount;

  if (!submittingMemberId || !entryAmount || !entryPurpose) {
    return res.status(401).json({
      error: "FIELDS_REQUIRED",
      message: "Member ID, entry amount, entry and purpose are required.",
    });
  }

  //checks if the participantsIds is not null and it's an array or the submitting member ID is included or has any duplicate IDs
  if (
    participantsIds &&
    (!Array.isArray(participantsIds) ||
      !participantsIds.includes(submittingMemberId) ||
      hasDuplicates(participantsIds))
  ) {
    return res.status(400).json({
      error: "INVALID_CUSTOM_PARTICIPANTS_ARRAY",
      message: "Invalid custom participants array.",
    });
  }

  //checks if participantsIds is not null and the length of it's not less than 2
  if (participantsIds && participantsIds?.length < 2) {
    return res.status(401).json({
      error: "INVALID_CUSTOM_PARTICIPANTS",
      message: "At least two custom participants are required.",
    });
  }

  if (typeof rawEntryAmount === "string") {
    entryAmount = entryAmount.trim();
  }
  if (!isNumeric(entryAmount)) {
    //returns false if there is a space in num,or not num
    return res.status(401).json({
      error: "INVALID_TYPE",
      message: "Entry amount should be a number.",
    });
  }
  if (typeof rawEntryAmount === "string") {
    entryAmount = Number(rawEntryAmount);
  }

  if (entryAmount <= 0) {
    return res.status(401).json({
      error: "INVALID_ENTRY_AMOUNT",
      message: "Only positive values greater than zero are accepted.",
    });
  }

  const entryPurposeTrimmed = entryPurpose.trim();
  let entryDescriptionTrimmed = entryDescription
    ? entryDescription.trim()
    : null;

  if (entryDescriptionTrimmed && entryDescriptionTrimmed.length === 0) {
    entryDescriptionTrimmed = null;
  }

  let transactionStarted = false;
  try {
    //check for authorizaion
    //retrieving group id for the submitting member
    const isMemberValidQuery =
      "SELECT group_id FROM member WHERE id = ? AND user_id = ?";
    const groupIdResult = await dbQuery(isMemberValidQuery, [
      submittingMemberId,
      userId,
    ]); //if the user is a member then the corresponding array with {group_id obj} will be returned else empty array
    if (groupIdResult.length === 0) {
      return res.status(403).json({
        error: "NOT_A_MEMBER",
        message: "You are not authorized to add entry in this group",
      });
    }
    const groupId = groupIdResult[0]?.group_id;
    //retreiving the all the member_ids of the selected group
    const groupMembersQuery =
      "SELECT id AS member_id FROM member WHERE group_id = ?";
    const selectedGroupMembers = await dbQuery(groupMembersQuery, [groupId]);

    if (selectedGroupMembers.length === 0) {
      // it won't be true as there will be no group without a member, due to checks in create group controler: I'm doing it for extra care
      return res.status(403).json({
        error: "INVALID_GROUP",
        message: "The group is invalid",
      });
    }
    const selectedGroupMemberIds = selectedGroupMembers.map(
      (member) => member.member_id,
    );

    let participantsMemberIds = selectedGroupMemberIds; //Default: all members will be participants
    if (participantsIds && isSubset(participantsIds, selectedGroupMemberIds)) {
      participantsMemberIds = participantsIds;
    } else if (participantsIds) {
      return res.status(403).json({
        error: "INVALID_PARTICIPANTS_ARRAY",
        message:
          "The participants ID's array is not a subset of the members of the group.",
      });
    }

    // ******************************** AI Service Integration ********************************
    const purposeAndDescription = [entryPurposeTrimmed, entryDescriptionTrimmed]
      .filter(Boolean)
      .join(" "); // Combine purpose and description, filtering out null/undefined values

    let category = null;
    if (purposeAndDescription.length > 0) {
      try {
        const aiResponse = await getCategory(purposeAndDescription);
        category = aiResponse?.data?.category;
      } catch (error) {
        console.error("Error fetching category from AI service:", error);
        category = null; // Fallback to null if AI service fails
      }
    }
    await dbQuery("START TRANSACTION");
    transactionStarted = true;

    // Insert the new entry into the 'entry' table
    const sqlInsertQuery =
      "INSERT INTO entry (amount, purpose, description, member_id, category) VALUES (?, ?, ?, ?, ?)";
    const entryResults = await dbQuery(sqlInsertQuery, [
      entryAmount,
      entryPurposeTrimmed,
      entryDescriptionTrimmed,
      submittingMemberId,
      category,
    ]);

    const entryId = entryResults.insertId;

    // Calculate the individual share for each participant
    const individualShare = entryAmount / participantsMemberIds.length;

    const updateOwedAmountQuery =
      "UPDATE member SET amount_owed = amount_owed + ? WHERE id = ?";

    const participantsInsertQuery =
      "INSERT INTO entry_participant (member_id, entry_id) VALUES (?, ?)";

    // Array to store all promises
    const queries = [];

    participantsMemberIds.forEach((participantMemberId) => {
      // Insert each participant into the entry_participant table
      queries.push(
        dbQuery(participantsInsertQuery, [participantMemberId, entryId]),
      );

      // Update the amount owed by each participant
      let updatedAmount = 0;
      if (participantMemberId === submittingMemberId) {
        // The member who submitted the entry is credited
        updatedAmount = entryAmount - individualShare;
      } else {
        // Other members are debited
        updatedAmount = 0 - individualShare;
      }

      // Push the update query into the array of promises
      queries.push(
        dbQuery(updateOwedAmountQuery, [updatedAmount, participantMemberId]),
      );
    });

    // Execute all database queries in parallel
    await Promise.all(queries);

    // Commit transaction
    await dbQuery("COMMIT");
    transactionStarted = false;
    res.status(200).json({
      message:
        "New entry and participants added, and amounts updated successfully.",
      entryId,
    });
  } catch (error) {
    // Rollback transaction in case of error
    if (transactionStarted) {
      await dbQuery("ROLLBACK");
    }

    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      errorDetail: error.message,
    });
  }
};

module.exports = addNewEntry;
