const mongoose = require('mongoose');
require('dotenv').config();

const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

async function checkApplications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-portal');
    console.log('Connected to MongoDB\n');

    // Get all applications
    const allApplications = await Application.find({}).lean();
    console.log(`Total applications in database: ${allApplications.length}\n`);

    if (allApplications.length === 0) {
      console.log('No applications found in database.');
      process.exit(0);
    }

    // Get all jobs
    const allJobs = await Job.find({}).lean();
    console.log(`Total jobs in database: ${allJobs.length}\n`);

    // Get all recruiters
    const recruiters = await User.find({ role: 'recruiter' }).lean();
    console.log(`Total recruiters: ${recruiters.length}\n`);

    // Check each application
    for (const app of allApplications) {
      console.log('='.repeat(60));
      console.log(`Application ID: ${app._id}`);
      console.log(`Job ID: ${app.job}`);
      console.log(`Applicant ID: ${app.applicant}`);
      console.log(`Status: ${app.status}`);
      
      if (app.applicantInfo) {
        console.log(`Applicant Name: ${app.applicantInfo.firstName} ${app.applicantInfo.lastName}`);
      }

      // Find the job
      const job = allJobs.find(j => j._id.toString() === app.job.toString());
      if (job) {
        console.log(`Job Title: ${job.title}`);
        console.log(`Job Created By: ${job.createdBy}`);
        
        // Find the recruiter
        const recruiter = recruiters.find(r => r._id.toString() === job.createdBy.toString());
        if (recruiter) {
          console.log(`Recruiter: ${recruiter.firstName} ${recruiter.lastName} (${recruiter.email})`);
        } else {
          console.log(`⚠ WARNING: Recruiter not found for job creator ID: ${job.createdBy}`);
        }
      } else {
        console.log(`⚠ WARNING: Job not found for application job ID: ${app.job}`);
      }
      console.log('');
    }

    // Test the query that recruiter uses
    if (recruiters.length > 0) {
      const testRecruiter = recruiters[0];
      console.log('='.repeat(60));
      console.log(`Testing query for recruiter: ${testRecruiter._id} (${testRecruiter.email})`);
      
      const recruiterJobs = await Job.find({ createdBy: testRecruiter._id });
      const jobIds = recruiterJobs.map(job => job._id);
      console.log(`Recruiter has ${recruiterJobs.length} jobs with IDs:`, jobIds.map(id => id.toString()));
      
      const applications = await Application.find({ job: { $in: jobIds } });
      console.log(`Found ${applications.length} applications for this recruiter`);
      
      if (applications.length === 0 && allApplications.length > 0) {
        console.log('\n⚠ ISSUE DETECTED: Applications exist but not linked to this recruiter!');
        console.log('Checking if job IDs match...');
        for (const app of allApplications) {
          const appJobId = app.job.toString();
          const matchesJob = jobIds.some(jobId => jobId.toString() === appJobId);
          console.log(`  Application job ${appJobId} matches recruiter jobs: ${matchesJob}`);
        }
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkApplications();

