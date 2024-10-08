const mysql = require("mysql");
const util = require("util");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DATABASE,
});

db.connect((err) => {
  if (err) {
    console.log("db connection failed", err);
  } else {
    console.log("connetected to database");
  }
});

const dbQuery = util.promisify(db.query).bind(db);

module.exports = {
  dbQuery,
  db,
};
