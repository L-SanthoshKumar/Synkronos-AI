const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/job-portal')
  .then(async () => {
    console.log('Connected to MongoDB\n');

    // Find all users
    const users = await User.find({}).select('firstName lastName email role isActive');
    
    console.log(`Found ${users.length} users in database:\n`);
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Active: ${user.isActive}`);
      console.log('');
    });

    // Test email lookup
    const testEmails = ['srinvas@gmail.com', 'srinvas@GMAIL.com', 'SRINVAS@GMAIL.COM'];
    console.log('\nTesting email lookup:\n');
    
    for (const testEmail of testEmails) {
      const normalized = testEmail.toLowerCase().trim();
      const user = await User.findByEmail(normalized);
      console.log(`Email: ${testEmail} -> Normalized: ${normalized} -> Found: ${user ? 'YES' : 'NO'}`);
      if (user) {
        console.log(`  User: ${user.firstName} ${user.lastName} (${user.email})`);
      }
    }

    // Test password verification for recruiter
    const recruiter = await User.findOne({ role: 'recruiter' });
    if (recruiter) {
      console.log(`\n\nRecruiter found: ${recruiter.firstName} ${recruiter.lastName} (${recruiter.email})`);
      console.log(`Password hash exists: ${!!recruiter.password}`);
      console.log(`Password hash length: ${recruiter.password ? recruiter.password.length : 0}`);
      
      // Test with common passwords
      const testPasswords = ['password', '123456', 'password123', 'test123'];
      console.log('\nTesting password verification (this will show if password matches):');
      for (const testPassword of testPasswords) {
        try {
          const match = await recruiter.matchPassword(testPassword);
          console.log(`  Password "${testPassword}": ${match ? 'MATCH ✓' : 'NO MATCH ✗'}`);
        } catch (err) {
          console.log(`  Password "${testPassword}": ERROR - ${err.message}`);
        }
      }
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });

