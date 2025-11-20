const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const ParsedResume = require('../models/ParsedResume');
const User = require('../models/User');
const { parseResume } = require('../services/aiService');
const { ErrorResponse } = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/resumes');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'resume-' + uniqueSuffix + ext);
  },
});

// File filter for multer
const fileFilter = (req, file, cb) => {
  // Accept only PDF and DOCX files
  const filetypes = /pdf|docx|msword|vnd.openxmlformats-officedocument.wordprocessingml.document/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new ErrorResponse(
        'Invalid file type. Only PDF and DOCX files are allowed.',
        400
      ),
      false
    );
  }
};

// Initialize multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single('resume');

// @desc    Upload and parse resume
// @route   POST /api/v1/resume/upload
// @access  Private
const uploadResume = asyncHandler(async (req, res, next) => {
  // Handle file upload
  const uploadPromise = promisify(upload).bind(upload);
  
  try {
    await uploadPromise(req, res);
    
    if (!req.file) {
      return next(new ErrorResponse('Please upload a file', 400));
    }
    
    // Read the uploaded file
    const fileBuffer = fs.readFileSync(req.file.path);
    
    // Parse the resume using AI service
    const parsedData = await parseResume(fileBuffer, req.file.mimetype);
    
    // Save the parsed resume data
    const parsedResume = await ParsedResume.create({
      userId: req.user.id,
      ...parsedData,
      resumeFile: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
    
    // Update user with resume reference
    await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          resume: parsedResume._id,
          'profile.resumeParsed': true,
          'profile.lastResumeUpdate': Date.now()
        } 
      },
      { new: true, runValidators: true }
    );
    
    // Clean up the uploaded file after processing
    fs.unlinkSync(req.file.path);
    
    res.status(201).json({
      success: true,
      data: parsedResume,
    });
    
  } catch (err) {
    // Clean up file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ErrorResponse('File size exceeds 5MB limit', 400));
    }
    
    next(err);
  }
});

// @desc    Get parsed resume data for the authenticated user
// @route   GET /api/v1/resume
// @access  Private
const getResume = asyncHandler(async (req, res, next) => {
  const parsedResume = await ParsedResume.findOne({ userId: req.user.id });
  
  if (!parsedResume) {
    return next(new ErrorResponse('No resume found for this user', 404));
  }
  
  res.status(200).json({
    success: true,
    data: parsedResume,
  });
});

// @desc    Update parsed resume data
// @route   PUT /api/v1/resume
// @access  Private
const updateResume = asyncHandler(async (req, res, next) => {
  let parsedResume = await ParsedResume.findOne({ userId: req.user.id });
  
  if (!parsedResume) {
    return next(new ErrorResponse('No resume found for this user', 404));
  }
  
  // Update only the fields that are provided in the request body
  const updates = {};
  const allowedFields = ['skills', 'experience', 'education', 'certifications', 'projects'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  parsedResume = await ParsedResume.findByIdAndUpdate(
    parsedResume._id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: parsedResume,
  });
});

// @desc    Delete resume
// @route   DELETE /api/v1/resume
// @access  Private
const deleteResume = asyncHandler(async (req, res, next) => {
  const parsedResume = await ParsedResume.findOne({ userId: req.user.id });
  
  if (!parsedResume) {
    return next(new ErrorResponse('No resume found for this user', 404));
  }
  
  // Remove resume file if it exists
  if (parsedResume.resumeFile && fs.existsSync(parsedResume.resumeFile.path)) {
    fs.unlinkSync(parsedResume.resumeFile.path);
  }
  
  // Delete the parsed resume record
  await parsedResume.remove();
  
  // Update user to remove resume reference
  await User.findByIdAndUpdate(
    req.user.id,
    { 
      $unset: { resume: '' },
      $set: { 'profile.resumeParsed': false }
    },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Calculate match score for a job
// @route   GET /api/v1/resume/match/:jobId
// @access  Private
const calculateMatchScore = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId);
  
  if (!job) {
    return next(new ErrorResponse(`Job not found with id ${req.params.jobId}`, 404));
  }
  
  const parsedResume = await ParsedResume.findOne({ userId: req.user.id });
  
  if (!parsedResume) {
    return next(new ErrorResponse('No resume found for this user', 400));
  }
  
  // Calculate match score using AI service
  const matchResult = await calculateMatchScore(parsedResume, job);
  
  // Save or update the match score
  await MatchScore.findOneAndUpdate(
    { userId: req.user.id, jobId: job._id },
    {
      $set: {
        score: matchResult.score,
        skillMatch: matchResult.skillMatch,
        experienceMatch: matchResult.experienceMatch,
        educationMatch: matchResult.educationMatch,
        explanation: matchResult.explanation,
        lastCalculated: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  
  res.status(200).json({
    success: true,
    data: matchResult,
  });
});

module.exports = {
  uploadResume,
  getResume,
  updateResume,
  deleteResume,
  calculateMatchScore,
};
