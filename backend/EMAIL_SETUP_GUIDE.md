# Email Setup Guide - Quick Fix

## Problem: Not Receiving Emails

If you're not receiving emails, follow these steps:

## Step 1: Check if Email Credentials are Configured

1. Open `backend/.env` file
2. Check if these variables exist:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

## Step 2: If Credentials are Missing

### For Gmail:

1. **Enable 2-Factor Authentication** on your Google account
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Add to `.env` file**:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   EMAIL_FROM=your-email@gmail.com
   ```
   ⚠️ **Important**: Remove spaces from the app password!

4. **Restart Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```

## Step 3: Test Email Configuration

1. **Check Backend Console** when you perform an action (Schedule Interview, Select, Hire, Reject)
2. Look for these messages:
   - `[EMAIL] ✓ Email credentials found` - Good!
   - `[EMAIL] ⚠️ No email credentials configured` - Bad! Add credentials
   - `[EMAIL] ✓ Email sent successfully` - Email was sent!
   - `[EMAIL] ✗ Error sending email` - Check error details

## Step 4: Test Email Endpoint (Optional)

You can test email sending directly:

```bash
# Using curl or Postman
POST http://localhost:5000/api/applications/test-email
Headers: Authorization: Bearer YOUR_TOKEN
Body: { "to": "test@example.com" }
```

## Common Issues

### Issue 1: "Authentication failed"
- **Solution**: Use App Password, not your regular Gmail password
- Make sure 2FA is enabled

### Issue 2: "Connection failed"
- **Solution**: Check internet connection
- Verify EMAIL_SERVICE is correct (gmail, hotmail, yahoo)

### Issue 3: "Email service not configured"
- **Solution**: Add EMAIL_USER and EMAIL_PASSWORD to .env file
- Restart backend server after adding

### Issue 4: Emails going to Spam
- **Solution**: Check spam/junk folder
- Mark as "Not Spam" if found
- For production, use a professional email service

## Quick Test

1. Add credentials to `.env`
2. Restart backend: `npm run dev`
3. Perform an action (Schedule Interview, etc.)
4. Check backend console for `[EMAIL]` logs
5. Check your email inbox (and spam folder)

## Still Not Working?

Check the backend console for detailed error messages. The logs will tell you exactly what's wrong:
- Missing credentials
- Authentication failure
- Connection issues
- Email service errors

