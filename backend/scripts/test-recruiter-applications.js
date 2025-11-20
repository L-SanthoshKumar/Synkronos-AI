const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

mongoose.connect('mongodb://localhost:27017/job-portal')
  .then(async () => {
    console.log('Connected to MongoDB\n');

    // Find the recruiter
    const recruiter = await User.findOne({ role: 'recruiter' });
    if (!recruiter) {
      console.log('No recruiter found');
      process.exit(1);
    }

    console.log(`Recruiter: ${recruiter.firstName} ${recruiter.lastName} (${recruiter.email})`);
    console.log(`Recruiter ID: ${recruiter._id}\n`);

    // Get all jobs posted by this recruiter
    const jobs = await Job.find({ createdBy: recruiter._id });
    console.log(`Recruiter has ${jobs.length} jobs:`);
    jobs.forEach(job => {
      console.log(`  - ${job.title} (ID: ${job._id})`);
    });
    console.log('');

    const jobIds = jobs.map(job => job._id);
    
    // Get all applications for these jobs
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate({
        path: 'job',
        select: 'title company location workType jobType salary requirements summary description status createdAt createdBy',
        populate: {
          path: 'company',
          select: 'name'
        }
      })
      .populate('applicant', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`\nFound ${applications.length} applications:\n`);
    
    applications.forEach((app, index) => {
      console.log(`Application ${index + 1}:`);
      console.log(`  ID: ${app._id}`);
      console.log(`  Job: ${app.job?.title || 'N/A'}`);
      console.log(`  Applicant: ${app.applicantInfo?.firstName || app.applicant?.firstName} ${app.applicantInfo?.lastName || app.applicant?.lastName}`);
      console.log(`  Status: ${app.status}`);
      console.log(`  Has Applicant Info: ${!!app.applicantInfo}`);
      console.log(`  Has Resume: ${!!app.resume}`);
      console.log('');
    });

    // Test the response format
    const responseData = applications.map(app => {
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
        timeline: app.timeline || [],
        interviews: app.interviews || []
      };
    });

    console.log(`\nResponse data formatted: ${responseData.length} applications`);
    console.log(`First application in response:`, JSON.stringify(responseData[0], null, 2).substring(0, 500));

    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });

