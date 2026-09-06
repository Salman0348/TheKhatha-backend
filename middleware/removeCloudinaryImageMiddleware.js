const cloudinary = require("../configs/cloudinaryConfig");
const extractPublicId = require("../utils/pubIdFromCloudinaryUrl.util");

const removeCloudinaryImage = async (req, res, next) => {
  const isImgRemoved = req.body?.isImgRemoved === "true";
  const userNewImgUrl = req.imgUrl || null;

  let { oldImgUrl } = req.body;
  oldImgUrl = oldImgUrl === "null" ? null : oldImgUrl;

  const IMAGE_DELETE_FAILED = "IMAGE_DELETE_FAILED";

  if ((isImgRemoved || userNewImgUrl) && oldImgUrl) {
    try {
      const publicId = extractPublicId(oldImgUrl);

      // Don't use a callback with await
      const result = await cloudinary.uploader.destroy(publicId);

      console.log("Cloudinary delete result:", result);

      // Continue to the next middleware/controller
      return next();
    } catch (error) {
      console.error("Cloudinary deletion error:", error);

      return res.status(500).json({
        error: IMAGE_DELETE_FAILED,
        message: "Failed to delete old image from Cloudinary",
        details: error,
      });
    }
  }

  return next();
};

module.exports = removeCloudinaryImage;
