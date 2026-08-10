const { getGroupInfoService } = require("../services/getGroupInfo.service");
const { checkMemberShip } = require("../services/dbServices");

const getGroupInfoController = async (req, res) => {
  const { userId } = req.user;
  const { groupId, memberId } = req.query;

  if (!groupId || !memberId) {
    return res.status(400).json({
      error: "group id and member id is required",
    });
  }

  try {
    // calling checkMembership db service
    const isMember = await checkMemberShip(userId, memberId);

    if (!isMember) {
      return res.status(403).json({
        error: "You are not a member.",
      });
    }

    // get group info service call
    const member = await getGroupInfoService(userId, memberId);

    // get selected group members account details
    return res.status(200).json({
      data: member,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = getGroupInfoController;
