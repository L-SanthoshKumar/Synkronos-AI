# How to Check Logs for Recruiter Applications

## Backend Logs (Node.js/Express Server)

### Where to Find:
1. **Terminal/Command Prompt** where you started the backend server
2. Look for lines starting with `[RECRUITER APPLICATIONS]`

### What to Look For:
When you access the Applications page, you should see logs like:

```
[RECRUITER APPLICATIONS] Fetching applications for recruiter: 6918448330c0a2ae22e39bcd (srinvas@gmail.com)
[RECRUITER APPLICATIONS] Recruiter 6918448330c0a2ae22e39bcd has 4 jobs with IDs: [...]
[RECRUITER APPLICATIONS] Found 3 applications for recruiter 6918448330c0a2ae22e39bcd
[RECRUITER APPLICATIONS] Returning 3 applications to frontend
```

### If No Applications Show:
- Check if you see: `[RECRUITER APPLICATIONS] WARNING: No applications to return!`
- Check if you see: `[RECRUITER APPLICATIONS] No jobs found for recruiter...`
- Check if you see: `[RECRUITER APPLICATIONS] Direct query found X applications (without populate)`

## Frontend Logs (Browser Console)

### How to Open:
1. **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. Click on the **Console** tab
3. Look for logs starting with `[FRONTEND]` or `[RecruiterApplications]`

### What to Look For:
When the page loads, you should see:

```
[FRONTEND] Fetching recruiter applications...
[FRONTEND] Recruiter applications response: { success: true, count: 3, data: [...] }
[RecruiterApplications] Loaded applications: 3
```

### If No Applications Show:
- Check if you see: `[FRONTEND] Recruiter applications response: { success: true, count: 0, data: [] }`
- Check for error messages: `[FRONTEND] Error fetching applications: ...`
- Check the Network tab to see the API response

## Network Tab (Browser DevTools)

### How to Check:
1. Open Browser DevTools (`F12`)
2. Go to **Network** tab
3. Filter by `my-applications` or `applications`
4. Click on the request
5. Check the **Response** tab

### What to Look For:
- **Status Code**: Should be `200` (success)
- **Response Body**: Should contain `{ success: true, data: [...] }`
- If status is `401` or `403`: Authentication issue
- If status is `500`: Server error (check backend logs)

## Quick Test

### Test the API Directly:
1. Open Browser Console (`F12`)
2. Make sure you're logged in as a recruiter
3. Run this command:

```javascript
fetch('/api/applications/my-applications', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('API Response:', data);
  console.log('Applications count:', data.data?.length || 0);
  if (data.data && data.data.length > 0) {
    console.log('First application:', data.data[0]);
  }
});
```

This will show you exactly what the API is returning.

## Common Issues

### Issue 1: No Logs Appearing
- **Backend**: Make sure the backend server is running
- **Frontend**: Make sure the page is making the API call (check Network tab)

### Issue 2: "No jobs found"
- The recruiter hasn't posted any jobs yet
- Check if jobs exist in the database

### Issue 3: "Found 0 applications"
- No one has applied to the recruiter's jobs yet
- Applications exist but are linked to different jobs

### Issue 4: Authentication Error
- Token expired or invalid
- Try logging out and logging back in

## Still Having Issues?

1. **Copy all logs** from both backend console and browser console
2. **Take a screenshot** of the Network tab response
3. **Check the database** using the diagnostic script:
   ```bash
   node backend/scripts/test-recruiter-applications.js
   ```

