const {
  getAccountService,
  createAccountService,
  updateAccountService,
  deleteAccountService,
} = require("../services/account.service");

const getAccountController = async (req, res) => {
  const { userId } = req.user;

  try {
    const account = await getAccountService(userId);

    return res.status(200).json({
      data: account,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

const createAccountController = async (req, res) => {
  const { userId } = req.user;

  const { accountType, accountTitle, accountNumber } = req.body;

  if (!accountType || !accountTitle || !accountNumber) {
    return res.status(400).json({
      error: "All account fields are required.",
    });
  }

  try {
    const response = await createAccountService(
      userId,
      accountType,
      accountTitle,
      accountNumber,
    );

    return res.status(201).json(response);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Account already exists.",
      });
    }

    return res.status(500).json({
      error: error.message,
    });
  }
};

const updateAccountController = async (req, res) => {
  const { userId } = req.user;

  const { accountType, accountTitle, accountNumber } = req.body;

  if (!accountType || !accountTitle || !accountNumber) {
    return res.status(400).json({
      error: "All account fields are required.",
    });
  }

  try {
    const response = await updateAccountService(
      userId,
      accountType,
      accountTitle,
      accountNumber,
    );

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

const deleteAccountController = async (req, res) => {
  const { userId } = req.user;

  try {
    const response = await deleteAccountService(userId);

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  getAccountController,
  createAccountController,
  updateAccountController,
  deleteAccountController,
};
