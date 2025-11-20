# Email Configuration Guide

This application uses Nodemailer to send email notifications to job seekers. To enable email functionality, you need to configure email credentials in your `.env` file.

## Required Environment Variables

Add the following variables to your `backend/.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

## Gmail Setup

If you're using Gmail, you'll need to:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to your Google Account settings
   - Navigate to Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this app password (not your regular password) in `EMAIL_PASSWORD`

## Other Email Services

You can use other email services by changing `EMAIL_SERVICE`:

- **Gmail**: `EMAIL_SERVICE=gmail`
- **Outlook/Hotmail**: `EMAIL_SERVICE=hotmail`
- **Yahoo**: `EMAIL_SERVICE=yahoo`
- **Custom SMTP**: Configure manually in `backend/utils/emailService.js`

## Email Notifications

The system sends emails for:

1. **Interview Scheduling**: When a recruiter schedules an interview
2. **Application Rejection**: When an application is rejected
3. **Job Offer/Hiring**: When an applicant is hired
4. **Recruiter Response**: When a recruiter responds to an application

## Development Mode

If email credentials are not configured, the system will:
- Log email details to the console instead of sending
- Continue functioning normally without sending actual emails
- Display a warning: `[EMAIL] No email credentials configured. Emails will not be sent.`

## Testing

To test email functionality:

1. Configure your email credentials in `.env`
2. Restart the backend server
3. Perform actions that trigger emails (schedule interview, reject application, etc.)
4. Check the backend console for email sending logs
5. Verify emails are received in the applicant's inbox

