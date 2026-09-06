const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authinticateToken = require("./middleware/authMiddleware");
const { upload, handleUpload } = require("./middleware/multerMiddleware");
const errorHandldingMiddleware = require("./middleware/errorHandldingMiddleware");
const groupsFetchController = require("./controllers/groups.controller.js");
const getGroupMembers = require("./controllers/getGroupMembers.contorller.js");
const addNewEntry = require("./controllers/addNewEntry.contorller.js");
const getGroupEntries = require("./controllers/getGroupEntries.controller.js");
const removeCloudinaryImage = require("./middleware/removeCloudinaryImageMiddleware.js");
const updateProfile = require("./controllers/updateProfile.controller.js");
const signup = require("./controllers/signup.controllerN.js");
const signin = require("./controllers/signin.controller.js");
const logout = require("./controllers/logout.controller.js");
const dashboard = require("./controllers/dashboard.controller.js");
const userCheck = require("./controllers/userCheck.controller.js");
const createGroup = require("./controllers/createGroup.controller.js");
const verifyEmail = require("./controllers/verifyEmail.controller.js");
const resendVerificationEmail = require("./controllers/resendVerificationEmail.controller.js");
const updateGroup = require("./controllers/updateGroup.controller.js");
const deleteGroup = require("./controllers/deleteGroup.controller.js");
const minimizeDebtController = require("./controllers/minimizeDebt.controller");
const getExpenseForecastController = require("./controllers/getExpenseForecast.controller.js");
const getExpenseAnalyticsController = require("./controllers/expenseAnalytics.controller.js");
const editBudgetController = require("./controllers/editBudget.controller.js");
const getGroupInfoController = require("./controllers/getGroupInfo.controllers.js");
const getFinancialAdvisorController = require("./controllers/financialAdvisor.controller.js");
const {
  getAccountController,
  createAccountController,
  updateAccountController,
  deleteAccountController,
} = require("./controllers/account.controller.js");
const {
  getMessages,
  sendMessage,
  getUnreadCount,
  markChatAsRead,
} = require("./controllers/chat.controller.js");

require("dotenv").config();

const app = express();
const corsOptions = {
  origin: process.env.CORS_ALLOWED_ORIGINS.split(","),
  credentials: process.env.CORS_CREDENTIALS === "true", // Access-Control-Allow-Credentials
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

// User sign in end point
app.post("/api/v1/login", signin);

//sign up  end point
app.post("/api/v1/signup", signup);

//verify-email
app.get("/api/v1/verify-email", verifyEmail);

//resend-verification
app.post("/api/v1/resend-verification", resendVerificationEmail);

/*********protected routes**************/
//check-user for adding members to a group
app.post("/api/v1/user-check", authinticateToken, userCheck);
//logout
app.post("/api/v1/logout", authinticateToken, logout);

//dashboard: checks authenetication of the user if authinticated,sends logged in user info
app.get("/api/v1/dashboard", authinticateToken, dashboard);

//create-group
app.post(
  "/api/v1/create-group",
  authinticateToken,
  upload.single("groupImage"),
  handleUpload,
  createGroup,
);

//groups
app.get("/api/v1/groups", authinticateToken, groupsFetchController);

//get groups members
app.post("/api/v1/groups-members", authinticateToken, getGroupMembers);

//add new entry
app.post("/api/v1/new-entry", authinticateToken, addNewEntry);

//group history entries
app.get("/api/v1/history-entries", authinticateToken, getGroupEntries);

app.post(
  "/api/v1/update-profile",
  authinticateToken,
  upload.single("newUserImg"),
  handleUpload,
  removeCloudinaryImage,
  updateProfile,
);

//update-group
app.post(
  "/api/v1/update-group",
  authinticateToken,
  upload.single("imageFile"),
  handleUpload,
  removeCloudinaryImage,
  updateGroup,
);

app.delete("/api/v1/delete-group/:id", authinticateToken, deleteGroup);

// minimize-debt
app.get("/api/v1/minimize-debt", authinticateToken, minimizeDebtController);

// get-expense-forecast
app.get(
  "/api/v1/expense-forecast",
  authinticateToken,
  getExpenseForecastController,
);

// expense-analytics
app.get(
  "/api/v1/expense-analytics",
  authinticateToken,
  getExpenseAnalyticsController,
);

// edit budget
app.patch("/api/v1/edit-budget", authinticateToken, editBudgetController);

// get group info (contains budget and accounts detail of selected group members)
app.get("/api/v1/group-info", authinticateToken, getGroupInfoController);

// get financial advise(recommendations)
app.get(
  "/api/v1/financial-advisor",
  authinticateToken,
  getFinancialAdvisorController,
);

// account routes
app.get("/api/v1/account", authinticateToken, getAccountController);
app.post("/api/v1/account", authinticateToken, createAccountController);
app.put("/api/v1/account", authinticateToken, updateAccountController);
app.delete("/api/v1/account", authinticateToken, deleteAccountController);

// chats routes
app.get("/api/v1/groups/:groupId/messages", authinticateToken, getMessages);

app.post("/api/v1/groups/:groupId/messages", authinticateToken, sendMessage);

app.get(
  "/api/v1/groups/:groupId/messages/unread",
  authinticateToken,
  getUnreadCount,
);

app.patch(
  "/api/v1/groups/:groupId/messages/read",
  authinticateToken,
  markChatAsRead,
);

// *************************************************************************** //

// Error handling middleware
app.use(errorHandldingMiddleware);

app.listen(process.env.PORT, () => {
  console.log("Server running on port 5000");
});
