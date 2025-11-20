# Job Creation Troubleshooting Guide

## Common Issues and Solutions

### 1. Authentication Issues

**Problem**: "Not authorized" or "Token failed" errors
**Solution**: 
- Ensure you're logged in as a recruiter
- Check that the JWT token is being sent in the Authorization header
- Verify the token hasn't expired

### 2. Validation Errors

**Problem**: "Validation failed" errors
**Solution**: Ensure all required fields are provided:
- Job title (5-200 characters)
- Job description (minimum 50 characters)
- Job summary (10-500 characters)
- Company name
- Industry
- Company size (startup, small, medium, large, enterprise)
- City
- Country
- Work type (remote, hybrid, onsite)
- Minimum salary (numeric)
- Maximum salary (numeric)
- At least one skill
- Job type (full-time, part-time, contract, internship, freelance)
- Job level (entry, mid, senior, lead, executive)
- Application deadline (ISO 8601 format)
- Contact email (valid email format)

### 3. File Upload Issues

**Problem**: "File too large" or "Invalid file type" errors
**Solution**:
- Logo files must be images (JPEG, PNG, GIF, SVG)
- Maximum file size is 5MB
- Use the field name 'logo' for company logos

### 4. Database Connection Issues

**Problem**: "Database connection error"
**Solution**:
- Ensure MongoDB is running
- Check the MONGODB_URI in your .env file
- Verify network connectivity

### 5. Server Issues

**Problem**: "Server error" or "Internal server error"
**Solution**:
- Check server logs for detailed error messages
- Ensure all environment variables are set
- Verify the uploads directory exists and is writable

## Testing Steps

### Step 1: Check Server Status
```bash
curl http://localhost:5000/health
```

### Step 2: Test Authentication
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

### Step 3: Test Job Creation (with token from step 2)
```bash
curl -X POST http://localhost:5000/api/jobs/test \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 4: Test Full Job Creation
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job",
    "description": "This is a test job description that meets the minimum length requirement of 50 characters.",
    "summary": "Test job summary",
    "company": {
      "name": "Test Company",
      "industry": "Technology",
      "size": "medium"
    },
    "location": {
      "city": "Test City",
      "country": "Test Country"
    },
    "workType": "remote",
    "salary": {
      "min": 50000,
      "max": 80000,
      "currency": "USD",
      "period": "yearly"
    },
    "requirements": {
      "skills": ["javascript", "react"],
      "experience": {
        "min": 1,
        "max": 3
      },
      "education": "bachelor"
    },
    "jobType": "full-time",
    "level": "mid",
    "applicationDeadline": "2024-12-31T23:59:59.000Z",
    "contact": {
      "email": "test@company.com"
    }
  }'
```

## Debug Mode

To enable detailed error logging, set in your `.env` file:
```
NODE_ENV=development
```

This will show detailed error messages in the response.

## Common Error Messages

1. **"Job title is required"** - Make sure the title field is filled
2. **"Job description must be at least 50 characters long"** - Increase description length
3. **"At least one skill is required"** - Add skills as a comma-separated list
4. **"Contact email is required"** - Provide a valid email address
5. **"Application deadline is required"** - Set a future date for the deadline
6. **"Minimum salary cannot be greater than maximum salary"** - Check salary range
7. **"User role 'jobseeker' is not authorized"** - Login as a recruiter

## Frontend Debugging

1. Open browser developer tools (F12)
2. Check the Network tab for failed requests
3. Look at the Console tab for JavaScript errors
4. Verify the API URL is correct in your .env file

## Backend Debugging

1. Check server logs for detailed error messages
2. Verify MongoDB connection
3. Ensure all required environment variables are set
4. Check file permissions for uploads directory

## Environment Variables Checklist

Make sure these are set in your `.env` file:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/job-portal
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

## Still Having Issues?

If you're still experiencing problems:

1. Run the debug script: `node debug-job-creation.js`
2. Check the server logs for detailed error messages
3. Verify all required fields are provided in the form
4. Ensure you're logged in as a recruiter
5. Try creating a job without a logo first
6. Check that the application deadline is in the future 

This will show all network connections and listening ports that involve port 5000, along with the associated process IDs (PID).

**How to interpret the output:**
- The last column is the PID (Process ID).
- You can then use Task Manager or the following command to find out which program is using that PID:
  ```powershell
  netstat -ano | findstr :5000
  ```

This will show all network connections and listening ports that involve port 5000, along with the associated process IDs (PID).

**How to interpret the output:**
- The last column is the PID (Process ID).
- You can then use Task Manager or the following command to find out which program is using that PID:
  ```powershell
  tasklist /FI "PID eq <PID_NUMBER>"
  ```

Would you like me to run this command for you, or do you want to try it yourself? 