const express = require('express');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user.getPublicProfile() });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user profile' });
  }
});

// @desc    Get recruiter dashboard (posted jobs and applicants)
// @route   GET /api/users/recruiter/dashboard
// @access  Private (recruiter only)
router.get('/recruiter/dashboard', protect, authorize('recruiter'), async (req, res) => {
  try {
    // Get jobs posted by recruiter
    const jobs = await Job.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    // Get applications for these jobs
    const jobIds = jobs.map(job => job._id);
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('applicant', 'firstName lastName email')
      .populate('job', 'title');
    res.json({ success: true, data: { jobs, applications } });
  } catch (error) {
    console.error('Recruiter dashboard error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard' });
  }
});

// @desc    Get jobseeker dashboard (applied jobs)
// @route   GET /api/users/jobseeker/dashboard
// @access  Private (jobseeker only)
router.get('/jobseeker/dashboard', protect, authorize('jobseeker'), async (req, res) => {
  try {
    // Get applications by user
    const applications = await Application.find({ applicant: req.user._id })
      .populate('job', 'title company location status')
      .sort({ appliedAt: -1 });
    res.json({ success: true, data: { applications } });
  } catch (error) {
    console.error('Jobseeker dashboard error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard' });
  }
});

module.exports = router; 