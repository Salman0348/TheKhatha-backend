const mysql = require("mysql2");
const util = require("util");
require("dotenv").config();
const fs = require("fs");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DATABASE,
  timezone: "Z",
  ssl: {
    ca: fs.readFileSync("./configs/ca.pem"),
  },
});

db.connect((err) => {
  if (err) {
    console.log("db connection failed", err);
  } else {
    console.log("connected to database");

    db.query("SET time_zone = '+00:00'", (err) => {
      if (err) {
        console.log("Failed to set DB timezone:", err);
      } else {
        console.log("Database session timezone set to UTC");
      }
    });
  }
});

const dbQuery = util.promisify(db.query).bind(db);

module.exports = {
  dbQuery,
  db,
};
