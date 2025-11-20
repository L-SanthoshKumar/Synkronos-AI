const express = require('express');
const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { protect, authorize, isJobSeeker, isRecruiter, canApplyToJob } = require('../middleware/auth');
const { uploadResume, getFileUrl } = require('../middleware/upload');
const { sendInterviewEmail, sendRejectionEmail, sendHiringEmail, sendResponseEmail, sendShortlistedEmail, sendInterviewedStatusEmail } = require('../utils/emailService');

const router = express.Router();

// @desc    Apply to a job
// @route   POST /api/applications/:jobId
// @access  Private (jobseeker only)
router.post('/:jobId', protect, isJobSeeker, canApplyToJob, uploadResume, [
  body('firstName').isLength({ min: 1, max: 50 }).withMessage('First name is required and must be between 1 and 50 characters'),
  body('lastName').isLength({ min: 1, max: 50 }).withMessage('Last name is required and must be between 1 and 50 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isLength({ min: 1, max: 20 }).withMessage('Phone number is required and must be between 1 and 20 characters'),
  body('degree').isLength({ min: 1, max: 50 }).withMessage('Degree is required and must be between 1 and 50 characters'),
  body('major').isLength({ min: 1, max: 100 }).withMessage('Major is required and must be between 1 and 100 characters'),
  body('college').isLength({ min: 1, max: 100 }).withMessage('College/University is required and must be between 1 and 100 characters'),
  body('graduationYear').isInt({ min: 1990, max: 2030 }).withMessage('Graduation year must be between 1990 and 2030'),
  body('cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10'),
  body('experience').optional().isLength({ max: 2000 }).withMessage('Experience details must not exceed 2000 characters'),
  body('skills').isLength({ min: 1, max: 500 }).withMessage('Skills are required and must be between 1 and 500 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('[APPLY] ✗ Validation errors:', errors.array());
      const errorMessages = errors.array().map(e => `${e.param}: ${e.msg}`).join(', ');
      return res.status(400).json({ 
        success: false, 
        message: `Validation failed: ${errorMessages}`,
        errors: errors.array() 
      });
    }
    if (!req.file) {
      console.error('[APPLY] ✗ No resume file uploaded');
      return res.status(400).json({ 
        success: false, 
        message: 'Resume file is required. Please upload your resume.' 
      });
    }
    
    console.log('[APPLY] ✓ Resume file received:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      degree,
      major,
      college,
      cgpa,
      graduationYear,
      experience, 
      skills 
    } = req.body;
    
    // Create application with all applicant details
    const applicationData = {
      job: req.params.jobId,
      applicant: req.user._id,
      resume: {
        filename: req.file.originalname,
        path: req.file.path.replace(/\\/g, '/'),
        uploadedAt: new Date()
      },
      // Store additional applicant information
      applicantInfo: {
        firstName,
        lastName,
        email,
        phone,
        qualifications: {
          degree,
          major,
          college,
          cgpa: cgpa || null,
          graduationYear
        },
        experience: experience || null,
        skills
      },
      status: 'applied', // Use 'applied' as default status for new applications
      appliedAt: new Date()
    };

    console.log('Creating application with data:', {
      jobId: req.params.jobId,
      applicantId: req.user._id,
      applicantName: `${firstName} ${lastName}`,
      email: email
    });

    const application = await Application.create(applicationData);
    
    console.log(`[APPLY] Application created successfully with ID: ${application._id}`);
    console.log(`[APPLY] Application linked to job: ${req.params.jobId}`);
    console.log(`[APPLY] Job created by (recruiter): ${req.job.createdBy}`);
    console.log(`[APPLY] Applicant: ${req.user._id} (${firstName} ${lastName})`);
    
    // Verify the application was saved correctly
    const verifyApplication = await Application.findById(application._id);
    console.log(`[APPLY] Verification - Application job field: ${verifyApplication.job}, Job ID: ${req.params.jobId}`);
    
    // Increment job application count
    await req.job.incrementApplications();
    
    console.log(`[APPLY] Job application count incremented for job: ${req.params.jobId}`);
    
    // Populate job data before returning
    // Note: company is an embedded object in Job, not a reference, so we don't populate it
    const populatedApplication = await Application.findById(application._id)
      .populate({
        path: 'job',
        select: 'title company location workType jobType salary requirements summary description status createdAt createdBy'
      })
      .populate('applicant', 'firstName lastName email');
    
    console.log(`[APPLY] Returning populated application. Job title: ${populatedApplication.job?.title}, Job createdBy: ${populatedApplication.job?.createdBy}`);
    
    res.status(201).json({ success: true, data: populatedApplication });
  } catch (error) {
    console.error('[APPLY] ✗ Error applying to job:', error);
    console.error('[APPLY] ✗ Error name:', error.name);
    console.error('[APPLY] ✗ Error message:', error.message);
    console.error('[APPLY] ✗ Error stack:', error.stack);
    
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
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid job ID or data format',
        error: error.message
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error applying to job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get all applications for current user
// @route   GET /api/applications
// @access  Private (jobseeker only)
router.get('/', protect, isJobSeeker, async (req, res) => {
  try {
    console.log(`[JOB SEEKER APPLICATIONS] Fetching applications for user: ${req.user._id} (${req.user.email})`);
    
    // Use direct query with proper logging
    const applications = await Application.find({ applicant: req.user._id })
      .populate({
        path: 'job',
        select: 'title company location workType jobType salary requirements summary description status createdAt',
        populate: {
          path: 'company',
          select: 'name'
        }
      })
      .sort({ appliedAt: -1, createdAt: -1 })
      .lean();
    
    console.log(`[JOB SEEKER APPLICATIONS] Found ${applications.length} applications for user ${req.user._id}`);
    
    if (applications.length > 0) {
      console.log(`[JOB SEEKER APPLICATIONS] Sample application:`, {
        id: applications[0]._id?.toString(),
        jobTitle: applications[0].job?.title,
        status: applications[0].status,
        appliedAt: applications[0].appliedAt
      });
    }
    
    // Format response data
    const responseData = applications.map(app => ({
      _id: app._id,
      job: app.job ? {
        _id: app.job._id,
        title: app.job.title,
        company: app.job.company,
        location: app.job.location,
        workType: app.job.workType,
        jobType: app.job.jobType,
        salary: app.job.salary,
        requirements: app.job.requirements,
        summary: app.job.summary,
        description: app.job.description,
        status: app.job.status,
        createdAt: app.job.createdAt
      } : null,
      applicantInfo: app.applicantInfo,
      status: app.status,
      resume: app.resume,
      appliedAt: app.appliedAt,
      createdAt: app.createdAt,
      timeline: app.timeline || []
    }));
    
    console.log(`[JOB SEEKER APPLICATIONS] Returning ${responseData.length} applications to frontend`);
    
    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('[JOB SEEKER APPLICATIONS] Get user applications error:', error);
    res.status(500).json({ success: false, message: 'Error fetching applications', error: error.message });
  }
});

// @desc    Debug endpoint to check applications (temporary)
// @route   GET /api/applications/debug
// @access  Private (recruiter only)
router.get('/debug', protect, isRecruiter, async (req, res) => {
  try {
    const allApplications = await Application.find({}).limit(10);
    const allJobs = await Job.find({ createdBy: req.user._id });
    const jobsByRecruiter = await Job.find({ createdBy: req.user._id });
    const appsForJobs = await Application.find({ job: { $in: jobsByRecruiter.map(j => j._id) } });
    
    res.json({
      success: true,
      debug: {
        totalApplications: allApplications.length,
        recruiterJobs: jobsByRecruiter.length,
        applicationsForRecruiterJobs: appsForJobs.length,
        recruiterId: req.user._id.toString(),
        jobIds: jobsByRecruiter.map(j => j._id.toString()),
        applications: appsForJobs.map(a => ({
          id: a._id.toString(),
          jobId: a.job.toString(),
          status: a.status
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get all applications for jobs posted by current recruiter
// @route   GET /api/applications/my-applications
// @access  Private (recruiter only)
router.get('/my-applications', protect, isRecruiter, async (req, res) => {
  try {
    console.log(`[RECRUITER APPLICATIONS] Fetching applications for recruiter: ${req.user._id} (${req.user.email})`);
    
    // First get all jobs posted by this recruiter
    const jobs = await Job.find({ createdBy: req.user._id });
    const jobIds = jobs.map(job => job._id);
    
    console.log(`[RECRUITER APPLICATIONS] Recruiter ${req.user._id} has ${jobs.length} jobs with IDs:`, jobIds.map(id => id.toString()));
    
    if (jobIds.length === 0) {
      console.log(`[RECRUITER APPLICATIONS] No jobs found for recruiter ${req.user._id}`);
      return res.json({ success: true, data: [] });
    }
    
    // Get all applications for these jobs (including pending - they remain visible in main list)
    // Use lean() for better performance and proper serialization
    // Note: company is an embedded object in Job, not a reference, so we don't populate it
    const applications = await Application.find({ 
      job: { $in: jobIds }
      // Removed pending filter - applications remain visible after actions
    })
      .populate({
        path: 'job',
        select: 'title company location workType jobType salary requirements summary description status createdAt createdBy'
      })
      .populate('applicant', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance and proper JSON serialization
    
    console.log(`[RECRUITER APPLICATIONS] Found ${applications.length} applications for recruiter ${req.user._id}`);
    
    // Log detailed application information for debugging
    if (applications.length > 0) {
      console.log('[RECRUITER APPLICATIONS] Sample application data:', {
        id: applications[0]._id.toString(),
        applicantName: applications[0].applicantInfo?.firstName + ' ' + applications[0].applicantInfo?.lastName,
        jobTitle: applications[0].job?.title,
        jobId: applications[0].job?._id?.toString(),
        jobCreatedBy: applications[0].job?.createdBy?.toString(),
        status: applications[0].status,
        hasApplicantInfo: !!applications[0].applicantInfo,
        hasResume: !!applications[0].resume
      });
    } else {
      console.log(`[RECRUITER APPLICATIONS] No applications found. Checking if applications exist for these jobs...`);
      // Check if there are any applications at all for these jobs (without populate)
      const allApplications = await Application.find({ job: { $in: jobIds } }).limit(5);
      console.log(`[RECRUITER APPLICATIONS] Direct query found ${allApplications.length} applications (without populate)`);
      if (allApplications.length > 0) {
        console.log(`[RECRUITER APPLICATIONS] First application job ID: ${allApplications[0].job}, Type: ${typeof allApplications[0].job}`);
        console.log(`[RECRUITER APPLICATIONS] Job IDs we're looking for:`, jobIds.map(id => id.toString()));
        const jobIdStrings = jobIds.map(id => id.toString());
        const appJobIdString = allApplications[0].job.toString();
        console.log(`[RECRUITER APPLICATIONS] Application job ID matches: ${jobIdStrings.includes(appJobIdString)}`);
      }
    }
    
    // Since we used lean(), applications are already plain objects
    // But we need to ensure proper formatting
    const responseData = applications.map(app => {
      try {
        // Safely access job properties
        const jobData = app.job ? {
          _id: app.job._id || app.job._id,
          title: app.job.title || '',
          company: app.job.company || {},
          location: app.job.location || '',
          workType: app.job.workType || '',
          jobType: app.job.jobType || '',
          salary: app.job.salary || {},
          requirements: app.job.requirements || [],
          summary: app.job.summary || '',
          description: app.job.description || '',
          status: app.job.status || 'active',
          createdAt: app.job.createdAt || app.job.createdAt,
          createdBy: app.job.createdBy || app.job.createdBy
        } : null;

        return {
          _id: app._id,
          job: jobData,
          applicant: app.applicant || null,
          applicantInfo: app.applicantInfo || null,
          status: app.status || 'pending',
          resume: app.resume || null,
          appliedAt: app.appliedAt || app.createdAt,
          createdAt: app.createdAt,
          timeline: app.timeline || [],
          interviews: (app.interviews || []).map(interview => ({
            type: interview.type,
            scheduledAt: interview.scheduledAt,
            duration: interview.duration,
            location: interview.location || '',
            status: interview.status || 'scheduled',
            feedback: interview.feedback || '',
            rating: interview.rating || null
            // Note: notes field removed per user request
          }))
        };
      } catch (err) {
        console.error(`[RECRUITER APPLICATIONS] Error formatting application ${app._id}:`, err);
        // Return minimal data if formatting fails
        return {
          _id: app._id,
          job: null,
          applicant: null,
          applicantInfo: app.applicantInfo || null,
          status: app.status || 'pending',
          resume: app.resume || null,
          appliedAt: app.appliedAt || app.createdAt,
          createdAt: app.createdAt,
          timeline: [],
          interviews: []
        };
      }
    });
    
    console.log(`[RECRUITER APPLICATIONS] Returning ${responseData.length} applications to frontend`);
    if (responseData.length > 0) {
      console.log(`[RECRUITER APPLICATIONS] First application in response:`, {
        id: responseData[0]._id?.toString(),
        hasJob: !!responseData[0].job,
        jobTitle: responseData[0].job?.title,
        hasApplicantInfo: !!responseData[0].applicantInfo,
        applicantName: responseData[0].applicantInfo?.firstName + ' ' + responseData[0].applicantInfo?.lastName,
        status: responseData[0].status
      });
      console.log(`[RECRUITER APPLICATIONS] All application IDs being returned:`, responseData.map(a => a._id.toString()));
    } else {
      console.log(`[RECRUITER APPLICATIONS] WARNING: No applications to return!`);
    }
    
    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('[RECRUITER APPLICATIONS] Get recruiter applications error:', error);
    console.error('[RECRUITER APPLICATIONS] Error stack:', error.stack);
    console.error('[RECRUITER APPLICATIONS] Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching applications', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get all applications for a job (recruiter only)
// @route   GET /api/applications/job/:jobId
// @access  Private (recruiter only, must own job)
router.get('/job/:jobId', protect, isRecruiter, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view applications for this job' });
    }
    const applications = await Application.findByJob(req.params.jobId);
    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ success: false, message: 'Error fetching job applications' });
  }
});

// @desc    Withdraw application (job seeker only)
// @route   PUT /api/applications/:applicationId/withdraw
// @access  Private (jobseeker only, must own application)
// NOTE: This specific route must come BEFORE the generic /:applicationId route
router.put('/:applicationId/withdraw', protect, isJobSeeker, async (req, res) => {
  try {
    console.log(`[WITHDRAW] Request received - Application ID: ${req.params.applicationId}, User ID: ${req.user._id}`);
    
    // Find application in MongoDB
    const application = await Application.findById(req.params.applicationId);
    
    if (!application) {
      console.log(`[WITHDRAW] Application not found in database: ${req.params.applicationId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found. Please check the application ID and try again.' 
      });
    }
    
    console.log(`[WITHDRAW] Application found - Applicant: ${application.applicant}, Current Status: ${application.status}`);
    
    // Check if job seeker owns the application
    if (application.applicant.toString() !== req.user._id.toString()) {
      console.log(`[WITHDRAW] Unauthorized - Applicant: ${application.applicant}, User: ${req.user._id}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to withdraw this application. This application belongs to another user.' 
      });
    }
    
    // Check if already withdrawn or in final states
    if (application.status === 'withdrawn') {
      return res.status(400).json({ 
        success: false, 
        message: 'Application is already withdrawn.' 
      });
    }
    
    if (['hired', 'rejected'].includes(application.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot withdraw application. Current status: ${application.status}. Applications with this status cannot be withdrawn.` 
      });
    }
    
    const oldStatus = application.status;
    
    // Update application status in MongoDB
    application.status = 'withdrawn';
    
    // Add to timeline
    application.timeline.push({
      action: 'withdrawn',
      description: `Application withdrawn by applicant (was ${oldStatus})`,
      user: req.user._id,
      timestamp: new Date()
    });
    
    // Save to MongoDB
    await application.save();
    
    console.log(`[WITHDRAW] Application ${req.params.applicationId} successfully withdrawn. Status changed from ${oldStatus} to withdrawn.`);
    
    // Populate before returning
    const populatedApplication = await Application.findById(application._id)
      .populate({
        path: 'job',
        select: 'title company location workType jobType salary requirements summary description status createdAt',
        populate: {
          path: 'company',
          select: 'name'
        }
      })
      .populate('applicant', 'firstName lastName email');
    
    res.json({ 
      success: true, 
      message: 'Application withdrawn successfully. The application has been removed from active consideration.',
      data: populatedApplication 
    });
  } catch (error) {
    console.error('[WITHDRAW] Error withdrawing application:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error withdrawing application. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get specific application details (recruiter only)
// @route   GET /api/applications/:applicationId
// @access  Private (recruiter only, must own job)
router.get('/:applicationId', protect, isRecruiter, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate({
        path: 'job',
        select: 'title company location workType jobType salary requirements summary description status createdAt createdBy',
        populate: {
          path: 'company',
          select: 'name'
        }
      })
      .populate('applicant', 'firstName lastName email phone location skills experience');
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    // Check if recruiter owns the job
    const job = await Job.findById(application.job._id);
    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this application' });
    }
    
    console.log(`Application details fetched for recruiter ${req.user._id}:`, {
      applicationId: application._id,
      applicantName: application.applicantInfo?.firstName + ' ' + application.applicantInfo?.lastName,
      hasApplicantInfo: !!application.applicantInfo,
      hasResume: !!application.resume,
      applicantInfoKeys: application.applicantInfo ? Object.keys(application.applicantInfo) : []
    });
    
    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Get application details error:', error);
    res.status(500).json({ success: false, message: 'Error fetching application details' });
  }
});

// @desc    Update application status (recruiter only)
// @route   PUT /api/applications/:applicationId/status
// @access  Private (recruiter only, must own job)
router.put('/:applicationId/status', protect, isRecruiter, [
  body('status').isIn(['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn']),
  body('message').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const application = await Application.findById(req.params.applicationId)
      .populate('job', 'createdBy title');
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    // Check if recruiter owns the job
    if (application.job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this application' });
    }

    const { status, message } = req.body;
    const oldStatus = application.status;
    application.status = status;

    // Populate applicant and job details for email
    await application.populate('applicant', 'firstName lastName email');
    // Job is already populated, but ensure company name is accessible
    const applicant = application.applicant;
    const jobTitle = application.job.title;
    // Handle company as both embedded object and reference
    const companyName = (application.job.company && typeof application.job.company === 'object' && application.job.company.name) 
      ? application.job.company.name 
      : 'Our Company';

    // Add to timeline
    application.timeline.push({
      action: 'status_update',
      description: `Status changed from ${oldStatus} to ${status}`,
      user: req.user._id
    });

    // Add communication if message provided
    if (message) {
      application.communications.push({
        type: 'email',
        subject: `Application Status Update - ${application.job.title}`,
        message: message,
        from: req.user._id,
        to: application.applicant,
        timestamp: new Date()
      });
    }

    // Send email notification based on status
    if (applicant && applicant.email) {
      const applicantName = `${applicant.firstName} ${applicant.lastName}`;
      
      switch (status) {
        case 'rejected':
          await sendRejectionEmail(
            applicant.email,
            applicantName,
            jobTitle,
            companyName,
            message || ''
          );
          break;
        case 'hired':
          await sendHiringEmail(
            applicant.email,
            applicantName,
            jobTitle,
            companyName,
            message || ''
          );
          break;
        case 'shortlisted':
          await sendShortlistedEmail(
            applicant.email,
            applicantName,
            jobTitle,
            companyName,
            message || ''
          );
          break;
        case 'interviewed':
          await sendInterviewedStatusEmail(
            applicant.email,
            applicantName,
            jobTitle,
            companyName,
            message || ''
          );
          break;
        default:
          // For other statuses, send a generic status update email
          if (message) {
            await sendResponseEmail(
              applicant.email,
              applicantName,
              jobTitle,
              companyName,
              `Application Status Update - ${jobTitle}`,
              `Your application status has been updated to: ${status}. ${message}`
            );
          }
          break;
      }
    }

    await application.save();
    
    res.json({ 
      success: true, 
      message: 'Application status updated successfully',
      data: application 
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, message: 'Error updating application status' });
  }
});

// @desc    Schedule interview (recruiter only)
// @route   POST /api/applications/:applicationId/schedule-interview
// @access  Private (recruiter only, must own job)
router.post('/:applicationId/schedule-interview', protect, isRecruiter, [
  body('type').isIn(['phone', 'video', 'onsite', 'technical', 'behavioral']).withMessage('Valid interview type is required'),
  body('scheduledAt').isISO8601().withMessage('Valid scheduled date/time is required'),
  body('duration').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('location').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Fetch application and populate applicant (userId) to get email from User collection
    const application = await Application.findById(req.params.applicationId)
      .populate('job', 'createdBy title company')
      .populate('applicant', 'firstName lastName email phone');
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    // Check if recruiter owns the job
    if (application.job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to schedule interview for this application' });
    }

    // Verify applicant email is fetched from User collection
    if (!application.applicant || !application.applicant.email) {
      console.error('[SCHEDULE INTERVIEW] Applicant email not found. Application ID:', application._id);
      return res.status(400).json({ success: false, message: 'Applicant email not found. Cannot send interview email.' });
    }

    const candidateEmail = application.applicant.email;
    const candidateName = `${application.applicant.firstName} ${application.applicant.lastName}`;
    console.log(`[SCHEDULE INTERVIEW] Sending email to candidate: ${candidateEmail} (${candidateName})`);

    const { type, scheduledAt, duration, location, mode } = req.body;

    // Get recruiter contact info
    const recruiter = await User.findById(req.user._id);
    const recruiterContact = {
      name: `${recruiter.firstName} ${recruiter.lastName}`,
      email: recruiter.email,
      phone: recruiter.phone || ''
    };

    // Create interview object
    const interview = {
      type,
      scheduledAt: new Date(scheduledAt),
      duration,
      location: location || '',
      status: 'scheduled',
      scheduledBy: req.user._id
    };

    // Use the model method to schedule interview
    await application.scheduleInterview(interview);

    // Update application status to 'interviewing' and set pending flag
    const oldStatus = application.status;
    application.status = 'interviewing';
    application.pending = true;
    application.recruiterContact = recruiterContact;

    // Add to history
    application.history.push({
      action: 'interview_scheduled',
      status: 'interviewing',
      description: `Interview scheduled: ${type} interview on ${new Date(scheduledAt).toLocaleString()}`,
      user: req.user._id,
      timestamp: new Date(),
      metadata: { interview }
    });

    // Also add to timeline for backward compatibility
    application.timeline.push({
      action: 'status_update',
      description: `Status updated from ${oldStatus} to interviewing (interview scheduled)`,
      user: req.user._id,
      timestamp: new Date()
    });

    await application.save();

    // Send email notification to applicant using email from User collection
    const companyName = (application.job.company && typeof application.job.company === 'object' && application.job.company.name) 
      ? application.job.company.name 
      : 'Our Company';
    
    try {
      const emailResult = await sendInterviewEmail(
        candidateEmail,
        candidateName,
        application.job.title,
        companyName,
        {
          type,
          scheduledAt,
          duration,
          location: location || '',
          mode: mode || (location && location.includes('http') ? 'Online' : 'Offline')
        },
        recruiterContact
      );
      
      if (emailResult.success) {
        console.log(`[SCHEDULE INTERVIEW] ✓ Email sent successfully to ${candidateEmail}`);
      } else {
        console.error(`[SCHEDULE INTERVIEW] ✗ Failed to send email to ${candidateEmail}:`, emailResult.message || emailResult.error);
        // Still continue - don't block interview scheduling
      }
    } catch (emailError) {
      console.error('[SCHEDULE INTERVIEW] ✗ Exception while sending email:', emailError);
      // Continue even if email fails - don't block the interview scheduling
    }

    // Populate before returning
    const populatedApplication = await Application.findById(application._id)
      .populate({
        path: 'job',
        select: 'title company location workType jobType salary requirements summary description status createdAt',
        populate: {
          path: 'company',
          select: 'name'
        }
      })
      .populate('applicant', 'firstName lastName email');

    res.json({ 
      success: true, 
      message: 'Interview scheduled successfully',
      data: populatedApplication 
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ success: false, message: 'Error scheduling interview' });
  }
});

// @desc    Send response to applicant (recruiter only)
// @route   POST /api/applications/:applicationId/respond
// @access  Private (recruiter only, must own job)
router.post('/:applicationId/respond', protect, isRecruiter, [
  body('subject').isLength({ min: 1, max: 200 }),
  body('message').isLength({ min: 1, max: 2000 }),
  body('responseType').isIn(['forward', 'reject', 'interview', 'offer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const application = await Application.findById(req.params.applicationId)
      .populate('job', 'createdBy title company')
      .populate('applicant', 'firstName lastName email');
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    // Check if recruiter owns the job
    if (application.job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this application' });
    }

    const { subject, message, responseType } = req.body;

    // Add communication
    application.communications.push({
      type: 'email',
      subject: subject,
      message: message,
      from: req.user._id,
      to: application.applicant,
      timestamp: new Date()
    });

    // When recruiter responds, set status to pending (as per user request)
    // This allows the application to be tracked in the pending list
    // Exception: if rejecting, set status to rejected
    const oldStatus = application.status;
    
    if (responseType === 'reject') {
      application.status = 'rejected';
    } else {
      // For all other response types, set to pending so it appears in pending list
      application.status = 'pending';
    }
    
    application.timeline.push({
      action: 'response_sent',
      description: `Response sent: ${subject}. Status set to ${application.status} for tracking.`,
      user: req.user._id
    });

    await application.save();

    // Send email notification to applicant
    if (application.applicant && application.applicant.email) {
      const companyName = application.job.company?.name || 'Our Company';
      await sendResponseEmail(
        application.applicant.email,
        `${application.applicant.firstName} ${application.applicant.lastName}`,
        application.job.title,
        companyName,
        subject,
        message
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Response sent successfully',
      data: {
        application,
        responseType,
        message: `Response sent to ${application.applicant.firstName} ${application.applicant.lastName}`
      }
    });
  } catch (error) {
    console.error('Send response error:', error);
    res.status(500).json({ success: false, message: 'Error sending response' });
  }
});

// @desc    Select/Shortlist candidate (recruiter only)
// @route   POST /api/applications/:applicationId/select
// @access  Private (recruiter only, must own job)
router.post('/:applicationId/select', protect, isRecruiter, async (req, res) => {
  try {
    // Fetch application and populate applicant (userId) to get email from User collection
    const application = await Application.findById(req.params.applicationId)
      .populate('job', 'createdBy title company')
      .populate('applicant', 'firstName lastName email phone');
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    // Check if recruiter owns the job
    if (application.job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to select this candidate' });
    }

    // Verify applicant email is fetched from User collection
    if (!application.applicant || !application.applicant.email) {
      console.error('[SELECT] Applicant email not found. Application ID:', application._id);
      return res.status(400).json({ success: false, message: 'Applicant email not found. Cannot send email.' });
    }

    const candidateEmail = application.applicant.email;
    const candidateName = `${application.applicant.firstName} ${application.applicant.lastName}`;
    console.log(`[SELECT] Sending email to candidate: ${candidateEmail} (${candidateName})`);

    const oldStatus = application.status;
    application.status = 'shortlisted';
    application.pending = true;

    // Add to history
    application.history.push({
      action: 'shortlisted',
      status: 'shortlisted',
      description: 'Candidate has been shortlisted',
      user: req.user._id,
      timestamp: new Date()
    });

    application.timeline.push({
      action: 'status_update',
      description: `Status updated from ${oldStatus} to shortlisted`,
      user: req.user._id,
      timestamp: new Date()
    });

    await application.save();

    // Send email notification using email from User collection
    const companyName = (application.job.company && typeof application.job.company === 'object' && application.job.company.name) 
      ? application.job.company.name 
      : 'Our Company';
    
    try {
      const emailResult = await sendShortlistedEmail(
        candidateEmail,
        candidateName,
        application.job.title,
        companyName,
        ''
      );
      
      if (emailResult.success) {
        console.log(`[SELECT] ✓ Email sent successfully to ${candidateEmail}`);
      } else {
        console.error(`[SELECT] ✗ Failed to send email to ${candidateEmail}:`, emailResult.message || emailResult.error);
      }
    } catch (emailError) {
      console.error('[SELECT] ✗ Exception while sending email:', emailError);
    }

    const populatedApplication = await Application.findById(application._id)
      .populate({
        path: 'job',
        select: 'title company location workType jobType salary requirements summary description status createdAt'
      })
      .populate('applicant', 'firstName lastName email');

    res.json({ 
      success: true, 
      message: 'Candidate shortlisted successfully. Email sent to applicant.',
      data: populatedApplication 
    });
  } catch (error) {
    console.error('Select candidate error:', error);
    res.status(500).json({ success: false, message: 'Error shortlisting candidate' });
  }
});

// @desc    Hire candidate (recruiter only)
// @route   POST /api/applications/:applicationId/hire
// @access  Private (recruiter only, must own job)
router.post('/:applicationId/hire', protect, isRecruiter, async (req, res) => {
  try {
    // Fetch application and populate applicant (userId) to get email from User collection
    const application = await Application.findById(req.params.applicationId)
      .populate('job', 'createdBy title company')
      .populate('applicant', 'firstName lastName email phone');
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    // Check if recruiter owns the job
    if (application.job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to hire this candidate' });
    }

    // Verify applicant email is fetched from User collection
    if (!application.applicant || !application.applicant.email) {
      console.error('[HIRE] Applicant email not found. Application ID:', application._id);
      return res.status(400).json({ success: false, message: 'Applicant email not found. Cannot send email.' });
    }

    const candidateEmail = application.applicant.email;
    const candidateName = `${application.applicant.firstName} ${application.applicant.lastName}`;
    console.log(`[HIRE] Sending email to candidate: ${candidateEmail} (${candidateName})`);

    const oldStatus = application.status;
    application.status = 'offered';
    application.pending = true;

    // Add to history
    application.history.push({
      action: 'hired',
      status: 'offered',
      description: 'Candidate has been offered the position',
      user: req.user._id,
      timestamp: new Date()
    });

    application.timeline.push({
      action: 'status_update',
      description: `Status updated from ${oldStatus} to offered`,
      user: req.user._id,
      timestamp: new Date()
    });

    await application.save();

    // Send email notification using email from User collection
    const companyName = (application.job.company && typeof application.job.company === 'object' && application.job.company.name) 
      ? application.job.company.name 
      : 'Our Company';
    
    try {
      const emailResult = await sendHiringEmail(
        candidateEmail,
        candidateName,
        application.job.title,
        companyName,
        ''
      );
      
      if (emailResult.success) {
        console.log(`[HIRE] ✓ Email sent successfully to ${candidateEmail}`);
      } else {
        console.error(`[HIRE] ✗ Failed to send email to ${candidateEmail}:`, emailResult.message || emailResult.error);
      }
    } catch (emailError) {
      console.error('[HIRE] ✗ Exception while sending email:', emailError);
    }

    const populatedApplication = await Application.findById(application._id)
      .populate({
        path: 'job',
        select: 'title company location workType jobType salary requirements summary description status createdAt'
      })
      .populate('applicant', 'firstName lastName email');

    res.json({ 
      success: true, 
      message: 'Candidate hired successfully. Email sent to applicant.',
      data: populatedApplication 
    });
  } catch (error) {
    console.error('Hire candidate error:', error);
    res.status(500).json({ success: false, message: 'Error hiring candidate' });
  }
});

// @desc    Reject candidate (recruiter only)
// @route   POST /api/applications/:applicationId/reject
// @access  Private (recruiter only, must own job)
router.post('/:applicationId/reject', protect, isRecruiter, async (req, res) => {
  try {
    // Fetch application and populate applicant (userId) to get email from User collection
    const application = await Application.findById(req.params.applicationId)
      .populate('job', 'createdBy title company')
      .populate('applicant', 'firstName lastName email phone');
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    // Check if recruiter owns the job
    if (application.job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this candidate' });
    }

    // Verify applicant email is fetched from User collection
    if (!application.applicant || !application.applicant.email) {
      console.error('[REJECT] Applicant email not found. Application ID:', application._id);
      return res.status(400).json({ success: false, message: 'Applicant email not found. Cannot send email.' });
    }

    const candidateEmail = application.applicant.email;
    const candidateName = `${application.applicant.firstName} ${application.applicant.lastName}`;
    console.log(`[REJECT] Sending email to candidate: ${candidateEmail} (${candidateName})`);

    const oldStatus = application.status;
    application.status = 'rejected';
    // Rejected applications don't go to pending list
    application.pending = false;

    // Add to history
    application.history.push({
      action: 'rejected',
      status: 'rejected',
      description: 'Application has been rejected',
      user: req.user._id,
      timestamp: new Date()
    });

    application.timeline.push({
      action: 'status_update',
      description: `Status updated from ${oldStatus} to rejected`,
      user: req.user._id,
      timestamp: new Date()
    });

    await application.save();

    // Send email notification using email from User collection
    const companyName = (application.job.company && typeof application.job.company === 'object' && application.job.company.name) 
      ? application.job.company.name 
      : 'Our Company';
    
    try {
      const emailResult = await sendRejectionEmail(
        candidateEmail,
        candidateName,
        application.job.title,
        companyName,
        ''
      );
      
      if (emailResult.success) {
        console.log(`[REJECT] ✓ Email sent successfully to ${candidateEmail}`);
      } else {
        console.error(`[REJECT] ✗ Failed to send email to ${candidateEmail}:`, emailResult.message || emailResult.error);
      }
    } catch (emailError) {
      console.error('[REJECT] ✗ Exception while sending email:', emailError);
    }

    const populatedApplication = await Application.findById(application._id)
      .populate({
        path: 'job',
        select: 'title company location workType jobType salary requirements summary description status createdAt'
      })
      .populate('applicant', 'firstName lastName email');

    res.json({ 
      success: true, 
      message: 'Application rejected. Email sent to applicant.',
      data: populatedApplication 
    });
  } catch (error) {
    console.error('Reject candidate error:', error);
    res.status(500).json({ success: false, message: 'Error rejecting candidate' });
  }
});

// @desc    Get pending applications (recruiter only)
// @route   GET /api/applications/pending
// @access  Private (recruiter only)
router.get('/pending', protect, isRecruiter, async (req, res) => {
  try {
    console.log(`[PENDING APPLICATIONS] Fetching pending applications for recruiter: ${req.user._id} (${req.user.email})`);
    
    // Get all jobs posted by this recruiter
    const jobs = await Job.find({ createdBy: req.user._id });
    const jobIds = jobs.map(job => job._id);
    
    console.log(`[PENDING APPLICATIONS] Recruiter ${req.user._id} has ${jobs.length} jobs`);
    
    if (jobIds.length === 0) {
      return res.json({ success: true, data: [] });
    }
    
    // Get all pending applications (where recruiter has taken action)
    const applications = await Application.find({ 
      job: { $in: jobIds },
      pending: true
    })
      .populate({
        path: 'job',
        select: 'title company location workType jobType salary requirements summary description status createdAt createdBy'
      })
      .populate('applicant', 'firstName lastName email phone')
      .sort({ 'history.0.timestamp': -1, createdAt: -1 })
      .lean();
    
    console.log(`[PENDING APPLICATIONS] Found ${applications.length} pending applications`);
    
    // Format response data
    const responseData = applications.map(app => {
      const lastAction = app.history && app.history.length > 0 
        ? app.history[app.history.length - 1] 
        : null;
      
      return {
        _id: app._id,
        job: app.job ? {
          _id: app.job._id,
          title: app.job.title,
          company: app.job.company,
          location: app.job.location,
          workType: app.job.workType,
          jobType: app.job.jobType,
          salary: app.job.salary,
          requirements: app.job.requirements,
          summary: app.job.summary,
          description: app.job.description,
          status: app.job.status,
          createdAt: app.job.createdAt,
          createdBy: app.job.createdBy
        } : null,
        applicant: app.applicant,
        applicantInfo: app.applicantInfo,
        status: app.status,
        resume: app.resume,
        appliedAt: app.appliedAt,
        createdAt: app.createdAt,
        lastAction: lastAction ? {
          action: lastAction.action,
          status: lastAction.status,
          description: lastAction.description,
          timestamp: lastAction.timestamp
        } : null
      };
    });
    
    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('[PENDING APPLICATIONS] Get pending applications error:', error);
    console.error('[PENDING APPLICATIONS] Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pending applications', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
  }
});

// @desc    Test email sending (recruiter only, for debugging)
// @route   POST /api/applications/test-email
// @access  Private (recruiter only)
router.post('/test-email', protect, isRecruiter, async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address (to) is required' 
      });
    }

    console.log('[TEST EMAIL] Testing email configuration...');
    console.log('[TEST EMAIL] Email credentials configured:', !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD));
    console.log('[TEST EMAIL] EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail');
    console.log('[TEST EMAIL] EMAIL_USER:', process.env.EMAIL_USER ? '***configured***' : 'NOT SET');
    console.log('[TEST EMAIL] EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***configured***' : 'NOT SET');
    console.log('[TEST EMAIL] Sending test email to:', to);

    const { sendEmail } = require('../utils/emailService');
    const testResult = await sendEmail({
      to: to,
      subject: 'Test Email - AI Job Portal',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from the AI Job Portal system.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `
    });

    if (testResult.success) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully! Check your inbox.',
        messageId: testResult.messageId,
        response: testResult.response
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send test email',
        error: testResult.error || testResult.message,
        code: testResult.code,
        details: 'Check backend console for detailed error logs. Make sure EMAIL_USER and EMAIL_PASSWORD are set in .env file.'
      });
    }
  } catch (error) {
    console.error('[TEST EMAIL] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error testing email',
      error: error.message 
    });
  }
});

// @desc    Add note to application (recruiter only)
// @route   POST /api/applications/:applicationId/notes
// @access  Private (recruiter only, must own job)
router.post('/:applicationId/notes', protect, isRecruiter, [
  body('content').isLength({ min: 1, max: 1000 }),
  body('isPrivate').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const application = await Application.findById(req.params.applicationId)
      .populate('job', 'createdBy');
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    // Check if recruiter owns the job
    if (application.job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to add notes to this application' });
    }

    const { content, isPrivate = false } = req.body;

    application.notes.push({
      content,
      author: req.user._id,
      isPrivate
    });

    await application.save();
    
    res.json({ 
      success: true, 
      message: 'Note added successfully',
      data: application.notes[application.notes.length - 1]
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ success: false, message: 'Error adding note' });
  }
});

module.exports = router; 