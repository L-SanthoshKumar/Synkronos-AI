const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes - requires authentication
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Middleware to restrict access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, please login'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Middleware to check if user is job seeker
const isJobSeeker = (req, res, next) => {
  return authorize('jobseeker')(req, res, next);
};

// Middleware to check if user is recruiter
const isRecruiter = (req, res, next) => {
  return authorize('recruiter')(req, res, next);
};

// Middleware to check if user owns the resource or is admin
const checkOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params[paramName]);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user owns the resource or is admin
      const ownerField = resource.createdBy ? 'createdBy' : 'applicant';
      const isOwner = resource[ownerField].toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

// Middleware to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Middleware to check if user can apply to job
const canApplyToJob = async (req, res, next) => {
  try {
    const Job = require('../models/Job');
    const Application = require('../models/Application');
    
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job is active and accepting applications
    if (!job.isAcceptingApplications()) {
      return res.status(400).json({
        success: false,
        message: 'This job is not accepting applications'
      });
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({
      job: req.params.jobId,
      applicant: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job'
      });
    }

    req.job = job;
    next();
  } catch (error) {
    console.error('Job application check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking job application eligibility'
    });
  }
};

// Middleware to check if user can manage job
const canManageJob = async (req, res, next) => {
  try {
    const Job = require('../models/Job');
    
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user created the job or is admin
    const isOwner = job.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this job'
      });
    }

    req.job = job;
    next();
  } catch (error) {
    console.error('Job management check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking job management permissions'
    });
  }
};

module.exports = {
  protect,
  authorize,
  isJobSeeker,
  isRecruiter,
  checkOwnership,
  generateToken,
  canApplyToJob,
  canManageJob
}; 