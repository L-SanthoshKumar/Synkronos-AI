const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { updateMatchScoresForJob } = require('./jobController');

// @desc    Get all applications
// @route   GET /api/v1/applications
// @route   GET /api/v1/jobs/:jobId/applications
// @access  Private/Recruiter
const getApplications = asyncHandler(async (req, res, next) => {
  if (req.params.jobId) {
    // Get applications for a specific job
    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'name email')
      .populate('job', 'title company.name');

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } else if (req.user.role === 'recruiter') {
    // Get all applications for jobs posted by the recruiter
    const applications = await Application.find()
      .populate({
        path: 'job',
        match: { postedBy: req.user.id },
        select: 'title company.name',
      })
      .populate('applicant', 'name email');

    // Filter out applications where job is null (not posted by this recruiter)
    const filteredApplications = applications.filter(
      (app) => app.job !== null
    );

    return res.status(200).json({
      success: true,
      count: filteredApplications.length,
      data: filteredApplications,
    });
  } else if (req.user.role === 'jobseeker') {
    // Get all applications for the current user
    const applications = await Application.find({ applicant: req.user.id })
      .populate('job', 'title company.name status')
      .sort('-appliedAt');

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } else {
    return next(
      new ErrorResponse('Not authorized to access this resource', 403)
    );
  }
});

// @desc    Get single application
// @route   GET /api/v1/applications/:id
// @access  Private
const getApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate('applicant', 'name email phone')
    .populate('job', 'title company.name');

  if (!application) {
    return next(
      new ErrorResponse(`Application not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is application owner, job poster, or admin
  if (
    application.applicant._id.toString() !== req.user.id &&
    application.job.postedBy.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this application`,
        401
      )
    );
  }

  // If user is a recruiter, include the resume and match score
  if (req.user.role === 'recruiter' || req.user.role === 'admin') {
    const parsedResume = await ParsedResume.findOne({
      userId: application.applicant._id,
    });

    const matchScore = await MatchScore.findOne({
      userId: application.applicant._id,
      jobId: application.job._id,
    });

    return res.status(200).json({
      success: true,
      data: {
        ...application.toObject(),
        parsedResume: parsedResume || null,
        matchScore: matchScore || null,
      },
    });
  }

  res.status(200).json({
    success: true,
    data: application,
  });
});

// @desc    Create application
// @route   POST /api/v1/jobs/:jobId/applications
// @access  Private/JobSeeker
const createApplication = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.applicant = req.user.id;
  req.body.job = req.params.jobId;

  // Check if job exists and is active
  const job = await Job.findById(req.params.jobId);

  if (!job) {
    return next(
      new ErrorResponse(`Job not found with id of ${req.params.jobId}`, 404)
    );
  }

  if (job.status !== 'active') {
    return next(new ErrorResponse('This job is no longer accepting applications', 400));
  }

  // Check if user has already applied to this job
  const existingApplication = await Application.findOne({
    applicant: req.user.id,
    job: req.params.jobId,
  });

  if (existingApplication) {
    return next(
      new ErrorResponse('You have already applied to this job', 400)
    );
  }

  // Check if user has a resume
  const parsedResume = await ParsedResume.findOne({ userId: req.user.id });

  if (!parsedResume) {
    return next(
      new ErrorResponse('Please upload and parse your resume before applying', 400)
    );
  }

  // Create application
  const application = await Application.create(req.body);

  // Increment application count on job
  await Job.findByIdAndUpdate(req.params.jobId, {
    $inc: { applicationCount: 1 },
  });

  // Calculate match score if not already calculated
  const existingMatchScore = await MatchScore.findOne({
    userId: req.user.id,
    jobId: req.params.jobId,
  });

  if (!existingMatchScore) {
    const matchResult = await calculateMatchScore(parsedResume, job);

    await MatchScore.create({
      userId: req.user.id,
      jobId: req.params.jobId,
      score: matchResult.score,
      skillMatch: matchResult.skillMatch,
      experienceMatch: matchResult.experienceMatch,
      educationMatch: matchResult.educationMatch,
      explanation: matchResult.explanation,
    });
  }

  res.status(201).json({
    success: true,
    data: application,
  });
});

// @desc    Update application status
// @route   PUT /api/v1/applications/:id/status
// @access  Private/Recruiter
const updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { status, notes } = req.body;
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(
      new ErrorResponse(`Application not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is authorized to update this application
  const job = await Job.findById(application.job);

  if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this application`,
        401
      )
    );
  }

  // Update status and add note if provided
  application.status = status;
  
  if (notes) {
    application.notes.push({
      text: notes,
      createdBy: req.user.id,
    });
  }

  await application.save();

  // Populate applicant and job details for response
  await application.populate('applicant', 'name email');
  await application.populate('job', 'title company.name');

  // TODO: Send email notification to applicant about status update

  res.status(200).json({
    success: true,
    data: application,
  });
});

// @desc    Withdraw application
// @route   PUT /api/v1/applications/:id/withdraw
// @access  Private/JobSeeker
const withdrawApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(
      new ErrorResponse(`Application not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is application owner
  if (
    application.applicant.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to withdraw this application`,
        401
      )
    );
  }

  // Only allow withdrawal if application is not already in a terminal state
  if (['withdrawn', 'hired', 'rejected'].includes(application.status)) {
    return next(
      new ErrorResponse(
        `Cannot withdraw application with status: ${application.status}`,
        400
      )
    );
  }

  application.status = 'withdrawn';
  application.withdrawnAt = Date.now();
  await application.save();

  // Decrement application count on job
  await Job.findByIdAndUpdate(application.job, {
    $inc: { applicationCount: -1 },
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get application statistics
// @route   GET /api/v1/applications/stats
// @access  Private/Recruiter
const getApplicationStats = asyncHandler(async (req, res, next) => {
  // Get count of applications by status for jobs posted by the recruiter
  const stats = await Application.aggregate([
    {
      $lookup: {
        from: 'jobs',
        localField: 'job',
        foreignField: '_id',
        as: 'job',
      },
    },
    { $unwind: '$job' },
    {
      $match: {
        'job.postedBy': req.user._id,
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Get top jobs with most applications
  const topJobs = await Application.aggregate([
    {
      $lookup: {
        from: 'jobs',
        localField: 'job',
        foreignField: '_id',
        as: 'job',
      },
    },
    { $unwind: '$job' },
    {
      $match: {
        'job.postedBy': req.user._id,
      },
    },
    {
      $group: {
        _id: '$job.title',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // Get application trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trend = await Application.aggregate([
    {
      $lookup: {
        from: 'jobs',
        localField: 'job',
        foreignField: '_id',
        as: 'job',
      },
    },
    { $unwind: '$job' },
    {
      $match: {
        'job.postedBy': req.user._id,
        appliedAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats,
      topJobs,
      trend,
    },
  });
});

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationStats,
};
