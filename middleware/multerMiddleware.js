const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("../configs/cloudinaryConfig");

// storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, "../uploads/")); //destination folder
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname + Date.now() + path.extname(file.originalname)); // filename
  },
});

// Initializing upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 2000000 }, // Limit file size to 2MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

// Check file type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"));
  }
}

// Middleware to handle file upload
const handleUpload = async (req, res, next) => {
  if (req.file) {
    try {
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);
      // Remove local file
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        return res.status(500).json({
          error: "INTERNAL_ERROR",
          message: "Error removing file from local server",
          errDetail: err,
        });
      }

      // add Cloudinary URL to the req
      req.imgUrl = result.secure_url;
      next();
    } catch (error) {
      // Remove local file in case of error
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        return res.status(500).json({
          error: "INTERNAL_ERROR",
          message: "Error removing file on error from local server",
          errDetail: err,
        });
      }
      return res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Error uploading file to cloudinary.",
        errDetail: error,
      });
    }
  } else {
    next();
  }
};

module.exports = { upload, handleUpload };
