const { dbQuery } = require("../utils/db");

const getAccountService = async (userId) => {
  const query = `
    SELECT
      id,
      account_type,
      account_title,
      account_number
    FROM user_account
    WHERE user_id = ?;
  `;

  const [account] = await dbQuery(query, [userId]);

  return account || null;
};

const createAccountService = async (
  userId,
  accountType,
  accountTitle,
  accountNumber,
) => {
  const query = `
    INSERT INTO user_account
    (
      user_id,
      account_type,
      account_title,
      account_number
    )
    VALUES (?, ?, ?, ?);
  `;

  await dbQuery(query, [userId, accountType, accountTitle, accountNumber]);

  return {
    message: "Account added successfully.",
  };
};

const updateAccountService = async (
  userId,
  accountType,
  accountTitle,
  accountNumber,
) => {
  const query = `
    UPDATE user_account
    SET
      account_type = ?,
      account_title = ?,
      account_number = ?
    WHERE user_id = ?;
  `;

  const result = await dbQuery(query, [
    accountType,
    accountTitle,
    accountNumber,
    userId,
  ]);

  if (result.affectedRows === 0) {
    throw new Error("Account not found.");
  }

  return {
    message: "Account updated successfully.",
  };
};

const deleteAccountService = async (userId) => {
  const query = `
    DELETE FROM user_account
    WHERE user_id = ?;
  `;

  const result = await dbQuery(query, [userId]);

  if (result.affectedRows === 0) {
    throw new Error("Account not found.");
  }

  return {
    message: "Account deleted successfully.",
  };
};

module.exports = {
  getAccountService,
  createAccountService,
  updateAccountService,
  deleteAccountService,
};
