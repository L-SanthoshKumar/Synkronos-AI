const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('[EMAIL] ⚠️  No email credentials configured!');
    console.warn('[EMAIL] ⚠️  Please add EMAIL_USER and EMAIL_PASSWORD to your .env file');
    console.warn('[EMAIL] ⚠️  Emails will NOT be sent until credentials are configured.');
    console.warn('[EMAIL] ⚠️  See EMAIL_CONFIGURATION.md for setup instructions.');
    return null;
  }

  console.log('[EMAIL] ✓ Email credentials found. Configuring transporter...');
  console.log('[EMAIL] Service:', process.env.EMAIL_SERVICE || 'gmail');
  console.log('[EMAIL] From:', process.env.EMAIL_FROM || process.env.EMAIL_USER);

  // For development, use Gmail or a test service
  // For production, configure with your actual SMTP settings
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Verify transporter configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error('[EMAIL] ✗ Transporter verification failed:', error.message);
        console.error('[EMAIL] ✗ Check your EMAIL_USER and EMAIL_PASSWORD in .env file');
      } else {
        console.log('[EMAIL] ✓ Email transporter verified successfully');
      }
    });

    return transporter;
  } catch (error) {
    console.error('[EMAIL] ✗ Error creating transporter:', error.message);
    return null;
  }
};

/**
 * Send email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} options.text - Plain text email body (optional)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    console.log(`[EMAIL] 📧 Attempting to send email to: ${to}`);
    console.log(`[EMAIL] 📧 Subject: ${subject}`);
    
    const transporter = createTransporter();
    
    if (!transporter) {
      console.error('[EMAIL] ✗ Cannot send email - transporter not configured');
      console.error('[EMAIL] ✗ Would have sent to:', to);
      console.error('[EMAIL] ✗ Subject:', subject);
      return { 
        success: false, 
        message: 'Email service not configured. Please add EMAIL_USER and EMAIL_PASSWORD to .env file' 
      };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    console.log('[EMAIL] 📤 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] ✓ Email sent successfully!');
    console.log('[EMAIL] ✓ Message ID:', info.messageId);
    console.log('[EMAIL] ✓ Response:', info.response);
    return { success: true, messageId: info.messageId, response: info.response };
  } catch (error) {
    console.error('[EMAIL] ✗ Error sending email:', error.message);
    console.error('[EMAIL] ✗ Error code:', error.code);
    console.error('[EMAIL] ✗ Error details:', {
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Provide helpful error messages
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Check your EMAIL_USER and EMAIL_PASSWORD in .env file. For Gmail, use an App Password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Check your internet connection and EMAIL_SERVICE setting.';
    }
    
    return { success: false, error: errorMessage, code: error.code };
  }
};

/**
 * Send interview scheduling email to job seeker
 */
const sendInterviewEmail = async (applicantEmail, applicantName, jobTitle, companyName, interviewDetails, recruiterContact) => {
  const { type, scheduledAt, duration, location, mode } = interviewDetails;
  
  const interviewDate = new Date(scheduledAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const interviewMode = mode || (location && location.includes('http') ? 'Online' : 'Offline');
  const meetingLink = location && location.includes('http') ? location : null;
  const physicalLocation = location && !location.includes('http') ? location : null;

  const subject = `Interview Scheduled for Your Application`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #4F46E5; }
        .contact-info { background-color: #EFF6FF; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .link { color: #4F46E5; text-decoration: none; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Interview Scheduled</h1>
        </div>
        <div class="content">
          <p>Dear ${applicantName},</p>
          
          <p>Your interview has been scheduled for <strong>${interviewDate}</strong>.</p>
          
          <p><strong>Role:</strong> ${jobTitle}</p>
          
          <p>Further instructions will follow.</p>
          
          <div class="details">
            <h3>Interview Details</h3>
            <p><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)} Interview</p>
            <p><strong>Date & Time:</strong> ${interviewDate}</p>
            <p><strong>Duration:</strong> ${duration} minutes</p>
            <p><strong>Mode:</strong> ${interviewMode}</p>
            ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}" class="link">${meetingLink}</a></p>` : ''}
            ${physicalLocation ? `<p><strong>Location:</strong> ${physicalLocation}</p>` : ''}
          </div>
          
          ${recruiterContact ? `
          <div class="contact-info">
            <h3>Recruiter Contact Details</h3>
            ${recruiterContact.name ? `<p><strong>Name:</strong> ${recruiterContact.name}</p>` : ''}
            ${recruiterContact.email ? `<p><strong>Email:</strong> <a href="mailto:${recruiterContact.email}" class="link">${recruiterContact.email}</a></p>` : ''}
            ${recruiterContact.phone ? `<p><strong>Phone:</strong> ${recruiterContact.phone}</p>` : ''}
          </div>
          ` : ''}
          
          <p>Best regards,<br>${companyName} Recruitment Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: applicantEmail,
    subject: subject,
    html: html
  });
};

/**
 * Send rejection email to job seeker
 */
const sendRejectionEmail = async (applicantEmail, applicantName, jobTitle, companyName, message) => {
  const subject = `Application Status Update`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Status Update</h1>
        </div>
        <div class="content">
          <p>Dear ${applicantName},</p>
          
          <p>Thank you for applying.</p>
          
          <p>We regret to inform you that your application for <strong>${jobTitle}</strong> was not selected.</p>
          
          <p>We appreciate your interest and wish you the best in your job search.</p>
          
          <p>Best regards,<br>${companyName} Recruitment Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: applicantEmail,
    subject: subject,
    html: html
  });
};

/**
 * Send hiring email to job seeker
 */
const sendHiringEmail = async (applicantEmail, applicantName, jobTitle, companyName, message) => {
  const subject = `Congratulations! You Have Been Offered the Position`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations!</h1>
        </div>
        <div class="content">
          <p>Dear ${applicantName},</p>
          
          <p>Congratulations! You have been selected for <strong>${jobTitle}</strong>.</p>
          
          <p>Our HR team will contact you regarding onboarding.</p>
          
          <p>Best regards,<br>${companyName} Recruitment Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: applicantEmail,
    subject: subject,
    html: html
  });
};

/**
 * Send shortlisted email to job seeker
 */
const sendShortlistedEmail = async (applicantEmail, applicantName, jobTitle, companyName, message) => {
  const subject = `You Have Been Shortlisted`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 You Have Been Shortlisted!</h1>
        </div>
        <div class="content">
          <p>Dear ${applicantName},</p>
          
          <p>You have been shortlisted for <strong>${jobTitle}</strong>.</p>
          
          <p>We will contact you soon for the next steps.</p>
          
          <p>Best regards,<br>${companyName} Recruitment Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: applicantEmail,
    subject: subject,
    html: html
  });
};

/**
 * Send interviewed status email to job seeker
 */
const sendInterviewedStatusEmail = async (applicantEmail, applicantName, jobTitle, companyName, message) => {
  const subject = `Application Update - ${jobTitle} at ${companyName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Interview Status Update</h1>
        </div>
        <div class="content">
          <p>Dear ${applicantName},</p>
          
          <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
          
          <p>We wanted to update you that your application has moved to the interview stage. ${message ? `Additional details: ${message}` : 'We will be in touch with further information soon.'}</p>
          
          <p>We appreciate your patience and look forward to the next steps in the process.</p>
          
          <p>Best regards,<br>${companyName} Recruitment Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: applicantEmail,
    subject: subject,
    html: html
  });
};

/**
 * Send response email to job seeker (when recruiter responds)
 */
const sendResponseEmail = async (applicantEmail, applicantName, jobTitle, companyName, subject, message) => {
  const emailSubject = subject || `Response Regarding Your Application - ${jobTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
        .message-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #4F46E5; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Response to Your Application</h1>
        </div>
        <div class="content">
          <p>Dear ${applicantName},</p>
          
          <p>Thank you for your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
          
          <div class="message-box">
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <p>If you have any questions, please feel free to contact us.</p>
          
          <p>Best regards,<br>${companyName} Recruitment Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: applicantEmail,
    subject: emailSubject,
    html: html
  });
};

module.exports = {
  sendEmail,
  sendInterviewEmail,
  sendRejectionEmail,
  sendHiringEmail,
  sendResponseEmail,
  sendShortlistedEmail,
  sendInterviewedStatusEmail
};

