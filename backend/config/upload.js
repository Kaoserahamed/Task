const config = require('./env');
const { UPLOAD } = require('./constants');
const logger = require('../utils/logger');

// Choose upload strategy based on environment
let upload;

if (config.aws.region && config.aws.s3Bucket) {
  logger.info('Using private S3 storage for file uploads');
  const storage = require('./storage');
  upload = storage.createS3Upload();
} else if (config.isVercel || config.nodeEnv === 'production') {
  logger.info('Using Cloudinary for file uploads');
  const cloudinaryConfig = require('./cloudinary');
  upload = cloudinaryConfig.upload;
} else {
  // Use local storage for development
  logger.info('📁 Using local storage for file uploads');
  const multer = require('multer');
  const path = require('path');

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });

  upload = multer({
    storage,
    limits: {
      fileSize: UPLOAD.MAX_FILE_SIZE,
      files: UPLOAD.MAX_FILES,
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    },
  });
}

module.exports = upload;
