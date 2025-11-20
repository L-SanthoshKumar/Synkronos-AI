const Job = require('../models/Job');
const MatchScore = require('../models/MatchScore');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { calculateMatchScore } = require('../services/aiService');

// @desc    Get all jobs
// @route   GET /api/v1/jobs
// @access  Public
const getJobs = asyncHandler(async (req, res, next) => {
  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Finding resource
  let query = Job.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Job.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const jobs = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  // If user is authenticated, calculate match scores for each job
  if (req.user) {
    const jobsWithScores = await Promise.all(
      jobs.map(async job => {
        const matchScore = await MatchScore.findOne({
          userId: req.user.id,
          jobId: job._id
        });

        return {
          ...job.toObject(),
          matchScore: matchScore ? matchScore.score : null
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: jobsWithScores.length,
      pagination,
      data: jobsWithScores
    });
  }

  res.status(200).json({
    success: true,
    count: jobs.length,
    pagination,
    data: jobs
  });
});

// @desc    Get single job
// @route   GET /api/v1/jobs/:id
// @access  Public
const getJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return next(
      new ErrorResponse(`Job not found with id of ${req.params.id}`, 404)
    );
  }

  // If user is authenticated, include match score
  if (req.user) {
    const matchScore = await MatchScore.findOne({
      userId: req.user.id,
      jobId: job._id
    });

    return res.status(200).json({
      success: true,
      data: {
        ...job.toObject(),
        matchScore: matchScore ? matchScore.score : null,
        matchDetails: matchScore ? matchScore : null
      }
    });
  }

  res.status(200).json({
    success: true,
    data: job
  });
});

// @desc    Create new job
// @route   POST /api/v1/jobs
// @access  Private/Recruiter
const createJob = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.postedBy = req.user.id;

  // Check for published job
  const publishedJob = await Job.findOne({ user: req.user.id });

  // If the user is not an admin, they can only add one job
  if (publishedJob && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user.id} has already published a job`,
        400
      )
    );
  }

  const job = await Job.create(req.body);

  res.status(201).json({
    success: true,
    data: job
  });
});

// @desc    Update job
// @route   PUT /api/v1/jobs/:id
// @access  Private/Recruiter
const updateJob = asyncHandler(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(
      new ErrorResponse(`Job not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is job poster or admin
  if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this job`,
        401
      )
    );
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Recalculate match scores for all applicants
  if (req.body.skills || req.body.requirements) {
    await updateMatchScoresForJob(job._id);
  }

  res.status(200).json({
    success: true,
    data: job
  });
});

// @desc    Delete job
// @route   DELETE /api/v1/jobs/:id
// @access  Private/Recruiter
const deleteJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return next(
      new ErrorResponse(`Job not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is job poster or admin
  if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this job`,
        401
      )
    );
  }

  // Delete all related match scores
  await MatchScore.deleteMany({ jobId: job._id });
  
  // Delete the job
  await job.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get jobs within a radius
// @route   GET /api/v1/jobs/radius/:zipcode/:distance
// @access  Public
const getJobsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide dist by radius of Earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const jobs = await Job.find({
    'location.coordinates': {
      $geoWithin: { $centerSphere: [[lng, lat], radius] }
    }
  });

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

// @desc    Get top jobs for user
// @route   GET /api/v1/jobs/top-matches
// @access  Private
const getTopJobMatches = asyncHandler(async (req, res, next) => {
  const { limit = 10, minScore = 70, location, jobType } = req.query;
  
  // Check if user has a parsed resume
  const parsedResume = await ParsedResume.findOne({ userId: req.user.id });
  
  if (!parsedResume) {
    return next(new ErrorResponse('Please upload and parse your resume first', 400));
  }
  
  // Build base query
  const query = { status: 'active' };
  
  // Add location filter if provided
  if (location) {
    query['$or'] = [
      { 'location.city': new RegExp(location, 'i') },
      { 'location.country': new RegExp(location, 'i') },
      { isRemote: true }
    ];
  }
  
  // Add job type filter if provided
  if (jobType) {
    query.jobType = jobType;
  }
  
  // Find jobs that match the filters
  const jobs = await Job.find(query).limit(parseInt(limit, 10));
  
  // Calculate match scores for each job
  const jobsWithScores = await Promise.all(
    jobs.map(async job => {
      // Check if we already have a match score for this job
      let matchScore = await MatchScore.findOne({
        userId: req.user.id,
        jobId: job._id
      });
      
      // If no match score exists or it's outdated, calculate a new one
      if (!matchScore || isScoreOutdated(matchScore)) {
        const matchResult = await calculateMatchScore(parsedResume, job);
        
        // Save or update the match score
        matchScore = await MatchScore.findOneAndUpdate(
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
      }
      
      return {
        ...job.toObject(),
        matchScore: matchScore.score,
        matchDetails: matchScore
      };
    })
  );
  
  // Filter by minimum score and sort by score (descending)
  const filteredAndSorted = jobsWithScores
    .filter(job => job.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);
  
  res.status(200).json({
    success: true,
    count: filteredAndSorted.length,
    data: filteredAndSorted
  });
});

// Helper function to check if a match score is outdated
function isScoreOutdated(matchScore) {
  if (!matchScore.lastCalculated) return true;
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return matchScore.lastCalculated < oneWeekAgo;
}

// Helper function to update match scores for all applicants to a job
async function updateMatchScoresForJob(jobId) {
  const job = await Job.findById(jobId);
  
  if (!job) return;
  
  // Find all users who have applied to this job
  const applications = await Application.find({ job: jobId }).populate('applicant');
  
  // Update match scores for each applicant
  for (const app of applications) {
    const parsedResume = await ParsedResume.findOne({ userId: app.applicant._id });
    
    if (parsedResume) {
      const matchResult = await calculateMatchScore(parsedResume, job);
      
      await MatchScore.findOneAndUpdate(
        { userId: app.applicant._id, jobId: job._id },
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
    }
  }
}

module.exports = {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getJobsInRadius,
  getTopJobMatches,
  updateMatchScoresForJob
};
