const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Job = require('../models/Job');
const { protect, authorize, canManageJob } = require('../middleware/auth');
const { uploadLogo, getFileUrl } = require('../middleware/upload');

const router = express.Router();

// @desc    Get all jobs (with filters)
// @route   GET /api/jobs
// @access  Public
router.get('/', [
  query('location').optional().isString(),
  query('skill').optional().isString(),
  query('workType').optional().isIn(['remote', 'hybrid', 'onsite']),
  query('level').optional().isIn(['entry', 'mid', 'senior', 'lead', 'executive']),
  query('jobTitle').optional().isString(),
  query('companyName').optional().isString()
], async (req, res) => {
  try {
    const filters = {};
    const andConditions = [];
    const { location, skill, workType, level, q, jobTitle, companyName } = req.query;

    // Location filter - search in both city and country
    if (location) {
      filters.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.country': new RegExp(location, 'i') }
      ];
    }
    
    if (skill) {
      filters['requirements.skills'] = { $in: [skill.toLowerCase()] };
    }
    if (workType) {
      filters['workType'] = workType;
    }
    if (level) {
      filters['level'] = level;
    }
    if (jobTitle) {
      filters['title'] = new RegExp(jobTitle, 'i');
    }
    if (companyName) {
      filters['company.name'] = new RegExp(companyName, 'i');
    }
    if (q) {
      // Search in multiple fields - combine with existing $or if location exists
      const searchOr = [
        { title: new RegExp(q, 'i') },
        { 'company.name': new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { summary: new RegExp(q, 'i') }
      ];
      
      if (filters.$or) {
        // Combine location and search filters
        filters.$and = [
          { $or: filters.$or },
          { $or: searchOr }
        ];
        delete filters.$or;
      } else {
        filters.$or = searchOr;
      }
    }
    
    // Only show active jobs
    filters.status = 'active';
    
    // Only filter by deadline if it exists and is in the past
    andConditions.push({
      $or: [
        { applicationDeadline: { $exists: false } },
        { applicationDeadline: null },
        { applicationDeadline: { $gt: new Date() } }
      ]
    });
    
    if (andConditions.length > 0) {
      if (filters.$and) {
        filters.$and.push(...andConditions);
      } else {
        filters.$and = andConditions;
      }
    }

    const jobs = await Job.find(filters).sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching jobs' });
  }
});

// @desc    Get jobs posted by current recruiter
// @route   GET /api/jobs/my-jobs
// @access  Private (recruiter only)
router.get('/my-jobs', protect, authorize('recruiter'), async (req, res) => {
  try {
    const jobs = await Job.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching jobs' });
  }
});

// @desc    Get a single job
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ success: false, message: 'Error fetching job' });
  }
});

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (recruiter only)
router.post('/', protect, authorize('recruiter'), uploadLogo, [
  body('title').isLength({ min: 5, max: 200 }),
  body('description').isLength({ min: 50 }),
  body('company.name').notEmpty(),
  body('location.city').notEmpty(),
  body('location.country').notEmpty(),
  body('workType').isIn(['remote', 'hybrid', 'onsite']),
  body('salary.min').isNumeric(),
  body('salary.max').isNumeric(),
  body('requirements.skills').custom((value) => {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error('At least one skill is required');
    }
    return true;
  }),
  body('jobType').isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance']),
  body('level').isIn(['entry', 'mid', 'senior', 'lead', 'executive']),
  body('applicationDeadline').optional().isISO8601().withMessage('Application deadline must be a valid date')
], async (req, res) => {
  try {
    console.log('Job creation request received:', {
      body: req.body,
      file: req.file,
      user: req.user._id
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const jobData = { ...req.body };
    
    // Handle file upload if present
    if (req.file) {
      console.log('File uploaded:', req.file);
      jobData.company = jobData.company || {};
      jobData.company.logo = req.file.path.replace(/\\/g, '/');
    }

    // Ensure required nested objects exist
    if (!jobData.company) jobData.company = {};
    if (!jobData.location) jobData.location = {};
    if (!jobData.salary) jobData.salary = {};
    if (!jobData.requirements) jobData.requirements = {};
    if (!jobData.contact) jobData.contact = {};

    // Set default values for optional fields
    jobData.status = jobData.status || 'active';
    jobData.maxApplications = jobData.maxApplications || 100;
    jobData.stats = jobData.stats || { views: 0, applications: 0, saves: 0 };
    
    // Ensure salary has required fields
    if (!jobData.salary.currency) jobData.salary.currency = 'USD';
    if (!jobData.salary.period) jobData.salary.period = 'yearly';
    
    // Ensure requirements has required fields
    if (!jobData.requirements.education) jobData.requirements.education = 'bachelor';
    if (!jobData.requirements.experience) {
      jobData.requirements.experience = { min: 0, max: 5 };
    }

    jobData.createdBy = req.user._id;

    console.log('Creating job with data:', jobData);

    const job = await Job.create(jobData);
    
    console.log('Job created successfully:', job._id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Job created successfully',
      data: job 
    });
  } catch (error) {
    console.error('Create job error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Job with this title already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error creating job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Test job creation (for debugging)
// @route   POST /api/jobs/test
// @access  Private (recruiter only)
router.post('/test', protect, authorize('recruiter'), async (req, res) => {
  try {
    console.log('Test job creation - Request body:', req.body);
    console.log('Test job creation - User:', req.user);
    
    // Create a minimal test job
    const testJobData = {
      title: 'Test Job',
      description: 'This is a test job description that meets the minimum length requirement of 50 characters.',
      summary: 'Test job summary',
      company: {
        name: 'Test Company',
        industry: 'Technology',
        size: 'medium'
      },
      location: {
        city: 'Test City',
        country: 'Test Country'
      },
      workType: 'remote',
      salary: {
        min: 50000,
        max: 80000,
        currency: 'USD',
        period: 'yearly'
      },
      requirements: {
        skills: ['javascript', 'react'],
        experience: {
          min: 1,
          max: 3
        },
        education: 'bachelor'
      },
      jobType: 'full-time',
      level: 'mid',
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      contact: {
        email: 'test@company.com'
      },
      createdBy: req.user._id
    };
    
    console.log('Test job data:', testJobData);
    
    const job = await Job.create(testJobData);
    
    console.log('Test job created successfully:', job._id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Test job created successfully',
      data: job 
    });
  } catch (error) {
    console.error('Test job creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Test job creation failed',
      error: error.message 
    });
  }
});

// @desc    Update a job
// @route   PUT /api/jobs/:jobId
// @access  Private (recruiter only, must own job)
router.put('/:jobId', protect, authorize('recruiter'), canManageJob, uploadLogo, async (req, res) => {
  try {
    const job = req.job;
    Object.assign(job, req.body);
    if (req.file) {
      job.company.logo = req.file.path.replace(/\\/g, '/');
    }
    await job.save();
    res.json({ success: true, data: job });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ success: false, message: 'Error updating job' });
  }
});

// @desc    Delete a job
// @route   DELETE /api/jobs/:jobId
// @access  Private (recruiter only, must own job)
router.delete('/:jobId', protect, authorize('recruiter'), canManageJob, async (req, res) => {
  try {
    await req.job.deleteOne();
    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ success: false, message: 'Error deleting job' });
  }
});

module.exports = router;
