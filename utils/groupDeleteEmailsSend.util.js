const nodemailer = require("nodemailer");
const logger = require("../configs/winstonLoggerConfig");
const { error } = require("winston");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use true for port 465, false for all other ports
  auth: {
    user: process.env.EMAIL_2,
    pass: process.env.EMAIL_APP_PASS_2,
  },
});

/**
 * Sends dynamic emails to the members of the deleting group.
 * @param {Array} members - An array of members objects with user_id, email, and amount_owed fields.
 * @param {int} adminId - ID of the admin: who deleted the group.
 * @param {Obj}  - The info of the group being deleted.
 */
async function groupDeleteEmailsSend(
  members,
  adminId,
  { group_name, groupId }
) {
  try {
    const [deletedByMemObj] = members.filter(
      (member) => member.user_id === adminId
    );

    // Collect all email promises
    const emailPromises = members.map((member) => {
      // Dynamic HTML for each member
      let emailsHTML = `
        <p><span style="font-weight: bold; color: #007bff;">"${group_name}"</span> group was deleted by ${
        member.user_id === deletedByMemObj.user_id
          ? "you"
          : deletedByMemObj.username
      }. Below is the amount owed by each member at the time of deletion:</p>
            ${members
              .map(
                (m) =>
                  `<p><strong>${
                    m.user_id === member.user_id
                      ? m.username + " (You)"
                      : m.username
                  }</strong>: ${m.amount_owed}</p>`
              )
              .join("")}
            <p>Thank you for your attention.</p>
            `;

      let mailOptions = {
        from: `TheKhatha <${process.env.EMAIL_2}>`,
        to: member.email,
        subject: `Group Deletion Notification`,
        html: emailsHTML,
      };

      // Return the promise from sendMail
      return transporter.sendMail(mailOptions).catch((error) => {
        logger.error(
          `Failed to send group deletion email to user ID:${
            member.user_id
          },group ID:${groupId}, error: ${error},at${new Date().toISOString()}`
        );
      });
    });

    // Await all email promises in parallel
    await Promise.all(emailPromises);
  } catch (error) {
    logger.error(
      `Error sending group deletion emails for group ID:${groupId},err:${error},at${new Date().toISOString()}`
    );
  }
}

module.exports = {
  groupDeleteEmailsSend,
};
