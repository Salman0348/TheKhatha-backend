const multer = require("multer");

const errorHandldingMiddleware = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle Multer errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "FILE_TOO_LARGE",
        message: "File size exceeds the limit of 2MB.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "INVALID_FILE_TYPE",
        message: "Invalid file type. Only JPEG, JPG, and PNG are allowed.",
      });
    }
    return res.status(400).json({
      error: "MULTER_ERROR",
      message: err.message,
    });
  } else {
    // Handle other types of errors
    return res.status(500).json({
      error: "GENERAL_ERROR",
      message: "An unexpected error occurred.",
      errDetail: err.message,
    });
  }
};

module.exports = errorHandldingMiddleware;
