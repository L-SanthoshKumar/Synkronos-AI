const axios = require('axios');

// Test job creation
async function testJobCreation() {
  try {
    // First, let's test login to get a token
    console.log('Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('Login successful, token received');
    
    // Test the test endpoint first
    console.log('Testing job creation with test endpoint...');
    const testResponse = await axios.post('http://localhost:5000/api/jobs/test', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Test job created successfully:', testResponse.data);
    
    // Now test the actual job creation
    console.log('Testing actual job creation...');
    const jobData = {
      title: 'Software Engineer',
      description: 'We are looking for a talented software engineer to join our team. This position requires strong programming skills and experience with modern web technologies.',
      summary: 'Join our team as a Software Engineer',
      company: {
        name: 'Tech Corp',
        industry: 'Technology',
        size: 'medium'
      },
      location: {
        city: 'San Francisco',
        country: 'USA'
      },
      workType: 'remote',
      salary: {
        min: 80000,
        max: 120000,
        currency: 'USD',
        period: 'yearly'
      },
      requirements: {
        skills: ['javascript', 'react', 'node.js'],
        experience: {
          min: 2,
          max: 5
        },
        education: 'bachelor'
      },
      jobType: 'full-time',
      level: 'mid',
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      contact: {
        email: 'hr@techcorp.com'
      }
    };
    
    const response = await axios.post('http://localhost:5000/api/jobs', jobData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Job created successfully:', response.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run the test
testJobCreation(); 