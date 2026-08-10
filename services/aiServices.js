const axios = require("axios");

// getting category by hitting the python server
async function getCategory(description) {
  try {
    const response = await axios.post(
      "http://127.0.0.1:8000/predict-category",
      {
        description: description,
      },
    );
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
      "http://127.0.0.1:8000/predict-forecast",
      forecastFeatures,
    );
    return response.data;
  } catch (error) {
    // console.error("Error fetching expense forecast:", error);
    throw error;
  }
}

module.exports = { getCategory, getExpenseForecastService };
