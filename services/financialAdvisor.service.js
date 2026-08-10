const { getForecastFeatures } = require("./expenseForecastFeatures.service");

const { getExpenseForecastService } = require("./aiServices");

const getFinancialAdvisor = async (userId, groupId) => {
  // Get financial metrics
  const features = await getForecastFeatures(userId, groupId);

  // Send only ML required features
  const forecastInput = {
    current_month_spending: features.current_month_spending,

    current_month_entry_count: features.current_month_entry_count,

    previous_month_spending: features.previous_month_spending,

    previous_month_entry_count: features.previous_month_entry_count,

    second_last_month_spending: features.second_last_month_spending,

    third_last_month_spending: features.third_last_month_spending,

    average_last_3_months: features.average_last_3_months,

    days_elapsed: features.days_elapsed,

    days_in_month: features.days_in_month,

    days_remaining: features.days_remaining,

    spending_velocity: features.spending_velocity,

    current_food_dining: features.current_food_dining,

    current_transportation: features.current_transportation,

    current_shopping: features.current_shopping,

    current_groceries: features.current_groceries,

    current_bills_utilities: features.current_bills_utilities,

    current_healthcare: features.current_healthcare,

    current_entertainment: features.current_entertainment,

    current_education: features.current_education,

    current_travel: features.current_travel,

    current_miscellaneous: features.current_miscellaneous,
  };

  // Get ML prediction
  const forecast = await getExpenseForecastService(forecastInput);

  const recommendations = [];

  /*
    Rule 1:
    Budget Warning
  */
  if (
    features.budget &&
    forecast &&
    forecast.expected_monthly_spending > features.budget
  ) {
    recommendations.push({
      type: "budget_warning",

      severity: "high",

      message: "You are likely to exceed your budget.",
    });
  }

  /*
    Rule 2:
    Overspending Detection

    Projected spending >
    historical average
  */

  if (
    forecast &&
    forecast.expected_monthly_spending > features.average_last_3_months
  ) {
    recommendations.push({
      type: "overspending",

      severity: "high",

      message: "Projected spending exceeds your historical average.",
    });
  }

  /*
    Rule 3:
    Category Dominance

    Example:
    Food > 50% of current spending
  */

  const categories = {
    "Food & Dining": features.current_food_dining,

    Transportation: features.current_transportation,

    Shopping: features.current_shopping,

    Groceries: features.current_groceries,

    "Bills & Utilities": features.current_bills_utilities,

    Healthcare: features.current_healthcare,

    Entertainment: features.current_entertainment,

    Education: features.current_education,

    Travel: features.current_travel,

    Miscellaneous: features.current_miscellaneous,
  };

  const highestCategory = Object.entries(categories).sort(
    (a, b) => b[1] - a[1],
  )[0];

  if (
    features.current_month_spending > 0 &&
    highestCategory[1] / features.current_month_spending >= 0.5
  ) {
    recommendations.push({
      type: "category_dominance",

      severity: "medium",

      message: `${highestCategory[0]} expenses dominate your spending.`,
    });
  }

  /*
    Rule 4:
    Spending Velocity Alert
  */

  if (
    features.previous_month_velocity &&
    features.spending_velocity > features.previous_month_velocity
  ) {
    recommendations.push({
      type: "velocity_alert",

      severity: "medium",

      message: "Your spending rate increased compared to last month.",
    });
  }

  /*
    Rule 5:
    Positive Reinforcement
  */

  if (recommendations.length === 0) {
    recommendations.push({
      type: "positive",

      severity: "low",

      message: "Your spending is under control.",
    });
  }

  return {
    forecast,

    recommendations,

    metrics: {
      budget: features.budget,
      currentSpending: features.current_month_spending,
      historicalAverage: features.average_last_3_months,
    },
  };
};

module.exports = {
  getFinancialAdvisor,
};
