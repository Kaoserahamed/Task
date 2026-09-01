const config = require('./env');

// Choose upload strategy based on environment
let upload;

if (config.isVercel || config.nodeEnv === 'production') {
  // Use Cloudinary for production/Vercel
  console.log('📦 Using Cloudinary for file uploads');
  const cloudinaryConfig = require('./cloudinary');
  upload = cloudinaryConfig.upload;
} else {
  // Use local storage for development
  console.log('📁 Using local storage for file uploads');
  const multer = require('multer');
  const path = require('path');

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });

  upload = multer({ 
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
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
    }
  });
}

module.exports = upload;
