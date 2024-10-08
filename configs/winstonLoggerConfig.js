const fs = require("fs");
const path = require("path");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

// Define the path for the logs directory (one level up from the current directory)
const logDir = path.join(__dirname, "..", "logs");
// Ensure the directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define the transport for rotating log files
const transport = new DailyRotateFile({
  filename: path.join(logDir, "app-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

// Create the logger instance
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    transport,
    // new winston.transports.Console()
  ],
});

module.exports = logger;
