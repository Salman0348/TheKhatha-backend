const axios = require("axios");

const baseURL =
  process.env.NODE_ENV === "production"
    ? process.env.AI_SERVICE_URL
    : "http://127.0.0.1:8000";

// getting category by hitting the python server
async function getCategory(description) {
  try {
    const response = await axios.post(`${baseURL}/predict-category`, {
      description: description,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching category:", error);
    throw error;
  }
}

// getting expense forecast by hitting the python server
async function getExpenseForecastService(forecastFeatures) {
  try {
    const response = await axios.post(
      `${baseURL}/predict-forecast`,
      forecastFeatures,
    );
    return response.data;
  } catch (error) {
    // console.error("Error fetching expense forecast:", error);
    throw error;
  }
}

module.exports = { getCategory, getExpenseForecastService };
