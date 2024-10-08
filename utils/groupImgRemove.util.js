// const cloudinary = require("../configs/cloudinaryConfig");
// const logger = require("../configs/winstonLoggerConfig");
// const extractPublicId = require("./pubIdFromCloudinaryUrl.util");

// /**
//  * removes the group img from cloudinary
//  * @param {string} url - url of the cloudinary image
//  * @param {number} groupId - group ID for usage in logging errors
//  */

// const groupImgRemove = async (url, groupId) => {
//   try {
//     const publicId = extractPublicId(url);
//     cloudinary.uploader.destroy(publicId, (error, result) => {
//       if (error) {
//         logger.error(
//           `Failed to remove group image from cloudinary, upon it's deletion, group ID:${groupId} at ${new Date().toISOString()}`
//         );
//       }
//     });
//   } catch (error) {
//     logger.error(
//       `error while removing group image from cloudinary, upon it's deletion, group ID:${groupId}, error:${error}at ${new Date().toISOString()}`
//     );
//   }
// };

// module.exports = groupImgRemove;

const { error } = require("winston");
const cloudinary = require("../configs/cloudinaryConfig");
const logger = require("../configs/winstonLoggerConfig");
const extractPublicId = require("./pubIdFromCloudinaryUrl.util");

/**
 * removes the group img from cloudinary
 * @param {string} url - url of the cloudinary image
 * @param {number} groupId - group ID for usage in logging errors
 */
const groupImgRemove = async (url, groupId) => {
  try {
    const publicId = extractPublicId(url);
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok") {
      logger.error(
        `Failed to remove group image from cloudinary,upon its deletion,group ID:${groupId},resutl:${
          result.result
        }, at ${new Date().toISOString()}`
      );
    }
  } catch (error) {
    logger.error(
      `Error while removing group image from cloudinary,group ID:${groupId},error:${error},at${new Date().toISOString()}`
    );
  }
};

module.exports = groupImgRemove;
