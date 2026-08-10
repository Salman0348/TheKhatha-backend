const {
  getForecastFeatures,
} = require("../services/expenseForecastFeatures.service.js");
const { getExpenseForecastService } = require("../services/aiServices.js");
const { checkGroupAccess } = require("../services/dbServices.js");

const getExpenseForecastController = async (req, res) => {
  const { userId } = req?.user;
  const { groupId } = req?.query;

  if (!groupId) {
    return res.status(400).json({ error: "groupId is required" });
  }

  try {
    const hasAccess = await checkGroupAccess(userId, groupId);

    if (!hasAccess) {
      return res
        .status(403)
        .json({ error: "Not a member: Access denied to this group" });
    }

    const forecastFeatures = await getForecastFeatures(userId, groupId);

    // Only send ML model required features
    const forecastModelInput = {
      current_month_spending: forecastFeatures.current_month_spending,

      current_month_entry_count: forecastFeatures.current_month_entry_count,

      previous_month_spending: forecastFeatures.previous_month_spending,

      previous_month_entry_count: forecastFeatures.previous_month_entry_count,

      second_last_month_spending: forecastFeatures.second_last_month_spending,

      third_last_month_spending: forecastFeatures.third_last_month_spending,

      average_last_3_months: forecastFeatures.average_last_3_months,

      days_elapsed: forecastFeatures.days_elapsed,

      days_in_month: forecastFeatures.days_in_month,

      days_remaining: forecastFeatures.days_remaining,

      spending_velocity: forecastFeatures.spending_velocity,

      current_food_dining: forecastFeatures.current_food_dining,

      current_transportation: forecastFeatures.current_transportation,

      current_shopping: forecastFeatures.current_shopping,

      current_groceries: forecastFeatures.current_groceries,

      current_bills_utilities: forecastFeatures.current_bills_utilities,

      current_healthcare: forecastFeatures.current_healthcare,

      current_entertainment: forecastFeatures.current_entertainment,

      current_education: forecastFeatures.current_education,

      current_travel: forecastFeatures.current_travel,

      current_miscellaneous: forecastFeatures.current_miscellaneous,
    };

    const forecast = await getExpenseForecastService(forecastModelInput);

    res.status(200).json({
      userId,
      groupId,
      forecast,
      forecastFeatures,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = getExpenseForecastController;
