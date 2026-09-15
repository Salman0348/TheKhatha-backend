const {
  getExpenseAnalytics,
} = require("../services/expenseAnalytics.service.js");

const { checkGroupAccess } = require("../services/dbServices.js");

const getExpenseAnalyticsController = async (req, res) => {
  const { userId } = req.user;

  const {
    groupId,
    type = "overall",
    period = "daily",
    startDateTime,
    endDateTime,
  } = req.query;

  if (!groupId) {
    return res.status(400).json({
      error: "groupId is required",
    });
  }

  if (!startDateTime || !endDateTime) {
    return res.status(400).json({
      error: "startDateTime and endDateTime are required",
    });
  }

  const validTypes = ["overall", "category"];

  const validPeriods = ["hourly", "daily", "weekly", "monthly"];

  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: "Invalid analytics type",
    });
  }

  if (!validPeriods.includes(period)) {
    return res.status(400).json({
      error: "Invalid analytics period",
    });
  }

  try {
    /*
      Make sure the logged-in user
      belongs to the requested group.
    */

    const hasAccess = await checkGroupAccess(userId, groupId);

    if (!hasAccess) {
      return res.status(403).json({
        error: "You are not a member of this group",
      });
    }

    /*
      Prevent future analytics requests.

      The frontend also prevents this,
      but backend validation is necessary.
    */

    const now = new Date();

    const requestedEnd = new Date(endDateTime);

    console.log("===== ANALYTICS TIME DEBUG =====");
    console.log("startDateTime received:", startDateTime);
    console.log("endDateTime received:", endDateTime);

    console.log("requestedEnd ISO:", requestedEnd.toISOString());
    console.log("server now ISO:", now.toISOString());

    console.log("requestedEnd timestamp:", requestedEnd.getTime());

    console.log("server now timestamp:", now.getTime());

    console.log("requestedEnd > now:", requestedEnd > now);

    console.log("================================");
    const allowedFutureMs = 10000; // 5 seconds

    if (requestedEnd.getTime() > now.getTime() + allowedFutureMs) {
      return res.status(400).json({
        error: "Analytics cannot go beyond the current date and time",
      });
    }

    // Calculate the oldest allowed date (1 year ago)
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Reject requests older than 1 year

    const requestedStartDate = new Date(startDateTime);
    if (requestedStartDate < oneYearAgo) {
      return res.status(400).json({
        error:
          "Analytics data cannot be requested for a period older than one year.",
        oldestAllowedDate: oneYearAgo.toISOString(),
      });
    }

    //fetch analytics data from service

    let analytics = await getExpenseAnalytics({
      userId,
      groupId,
      type,
      period,
      startDateTime,
      endDateTime,
    });

    // Format the total_amount to 2 decimal places for each analytics entry
    analytics = analytics.map((item) => ({
      ...item,
      total_amount: Number(Number(item.total_amount).toFixed(2)),
    }));

    return res.status(200).json({
      groupId,
      type,
      period,
      startDateTime,
      endDateTime,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching expense analytics:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = getExpenseAnalyticsController;
