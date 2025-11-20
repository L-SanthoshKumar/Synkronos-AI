const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectories based on file type
    let subDir = 'general';
    if (file.fieldname === 'resume') {
      subDir = 'resumes';
    } else if (file.fieldname === 'documents') {
      subDir = 'documents';
    } else if (file.fieldname === 'logo') {
      subDir = 'logos';
    }
    
    const dir = path.join(uploadDir, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedMimeTypes = {
    'resume': [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    'documents': [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ],
    'logo': [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml'
    ]
  };

  const allowedTypes = allowedMimeTypes[file.fieldname] || allowedMimeTypes.documents;
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types for ${file.fieldname}: ${allowedTypes.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10 // Maximum 10 files
  }
});

// Specific upload configurations
const uploadResume = upload.single('resume');
const uploadDocuments = upload.array('documents', 5); // Max 5 documents
const uploadLogo = upload.single('logo');
const uploadMultiple = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
  { name: 'logo', maxCount: 1 }
]);

// Error handling wrapper
const handleUpload = (uploadFunction) => {
  return (req, res, next) => {
    uploadFunction(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB.'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files uploaded.'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected file field.'
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// Helper function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Helper function to get file URL
const getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  
  // Extract filename from path
  const filename = path.basename(filePath);
  const type = path.dirname(filePath).split(path.sep).pop(); // Get the subdirectory name
  
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/files/${type}/${filename}`;
};

// Helper function to validate file size
const validateFileSize = (file, maxSize = 5 * 1024 * 1024) => {
  return file.size <= maxSize;
};

// Helper function to get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Helper function to check if file is PDF
const isPDF = (filename) => {
  return getFileExtension(filename) === '.pdf';
};

// Helper function to check if file is image
const isImage = (filename) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
  return imageExtensions.includes(getFileExtension(filename));
};

module.exports = {
  uploadResume: handleUpload(uploadResume),
  uploadDocuments: handleUpload(uploadDocuments),
  uploadLogo: handleUpload(uploadLogo),
  uploadMultiple: handleUpload(uploadMultiple),
  deleteFile,
  getFileUrl,
  validateFileSize,
  getFileExtension,
  isPDF,
  isImage,
  uploadDir
}; 