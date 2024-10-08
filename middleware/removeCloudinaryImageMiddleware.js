const cloudinary = require("../configs/cloudinaryConfig");
const extractPublicId = require("../utils/pubIdFromCloudinaryUrl.util");

const removeCloudinaryImage = async (req, res, next) => {
  const isImgRemoved = req.body?.isImgRemoved === "true"; //converting back to boolean value: as boolean/null are sent as strings in formdata
  const userNewImgUrl = req.imgUrl || null; //when file(img) is uploaded/changed the req.imgUrl will be present from multer middleware else null
  let { oldImgUrl } = req.body;
  oldImgUrl = oldImgUrl === "null" ? null : oldImgUrl;
  const IMAGE_DELETE_FAILED = "IMAGE_DELETE_FAILED";

  if ((isImgRemoved || userNewImgUrl) && oldImgUrl) {
    try {
      const publicId = extractPublicId(oldImgUrl);
      await cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          return res.status(500).json({
            error: IMAGE_DELETE_FAILED,
            message: "Failed to delete old image from cloudinary",
            details: error,
          });
        }

        next();
      });
    } catch (error) {
      return res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Internal server error in remove cloudinary image middleware",
        errorDetail: error,
      });
    }
  } else {
    next();
  }
};

module.exports = removeCloudinaryImage;
