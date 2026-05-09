/**
 * Email Templates for FMPG
 * Standardized, modern, and professional designs.
 */

const baseTemplate = (content, title = 'FMPG Update') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background-color: #000000;
      padding: 32px 40px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      letter-spacing: 2px;
      font-weight: 800;
    }
    .header span {
      color: #a3c614;
    }
    .content {
      padding: 40px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 32px 40px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #a3c614 0%, #82a010 100%);
      color: #000000 !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 24px 0;
      box-shadow: 0 4px 14px 0 rgba(163, 198, 20, 0.39);
    }
    .otp-card {
      background-color: #f3f4f6;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
      border: 1px dashed #d1d5db;
    }
    .otp-code {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #111827;
      margin: 0;
      font-family: 'Courier New', Courier, monospace;
    }
    .highlight-box {
      background-color: #f0fdf4;
      border-left: 4px solid #a3c614;
      padding: 20px;
      margin: 24px 0;
      border-radius: 0 8px 8px 0;
    }
    .info-grid {
      display: table;
      width: 100%;
      margin: 20px 0;
      border-collapse: collapse;
    }
    .info-row {
      display: table-row;
    }
    .info-label {
      display: table-cell;
      padding: 8px 0;
      font-weight: 700;
      color: #4b5563;
      width: 140px;
      font-size: 14px;
      text-transform: uppercase;
    }
    .info-value {
      display: table-cell;
      padding: 8px 0;
      color: #111827;
      font-weight: 500;
    }
    p { margin-bottom: 16px; }
    h2 { color: #111827; margin-top: 0; font-size: 22px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FM<span>PG</span></h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} FMPG Group. All rights reserved.</p>
      <p>Human Resources Department • FMPG Headquarters</p>
      <p style="margin-top: 10px;">
        <a href="mailto:contact@gmail.com" style="color: #a3c614; text-decoration: none;">Contact Support</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

exports.getOfferLetterTemplate = (name, jobTitle, link = 'https://careers.omsoftwares.in/my-applications', validUntil, hrContact) => baseTemplate(`
  <h2>Congratulations, ${name}!</h2>
  <p>We are pleased to offer you the position of <strong>${jobTitle}</strong> at FMPG.</p>
  <p>Our team was impressed with your background, and we believe you will be a great addition to our mission.</p>
  
  <div class="highlight-box">
    <p style="margin: 0; color: #166534; font-weight: 600;">Your official offer letter is attached. Please review the details carefully.</p>
  </div>

  ${validUntil ? `
  <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
    <p style="margin: 0; color: #9a3412;"><strong>⏰ Important:</strong> This offer is valid until <strong>${new Date(validUntil).toLocaleDateString('en-GB')}</strong></p>
  </div>
  ` : ''}

  <p>To accept this offer, please visit our portal:</p>
  
  <div style="text-align: center;">
    <a href="${link}" class="button">Review & Accept Offer</a>
  </div>

  ${hrContact ? `
  <div style="background-color: #f8f9fa; padding: 24px; border-radius: 12px; margin-top: 32px; border: 1px solid #e5e7eb;">
    <h4 style="margin: 0 0 12px 0; color: #374151;">📞 Have Questions?</h4>
    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Feel free to reach out to our HR team:</p>
    <p style="margin: 4px 0; color: #111827;"><strong>Contact:</strong> ${hrContact.name || 'HR Team'}</p>
    ${hrContact.email ? `<p style="margin: 4px 0; color: #111827;"><strong>Email:</strong> ${hrContact.email}</p>` : ''}
    ${hrContact.phone ? `<p style="margin: 4px 0; color: #111827;"><strong>Phone:</strong> ${hrContact.phone}</p>` : ''}
  </div>
  ` : ''}

  <p>Best Regards,<br><strong>The HR Team @ FMPG</strong></p>
`, `Offer Letter - ${jobTitle}`);

exports.getExtendedOfferTemplate = (name, jobTitle, link, validUntil, hrContact) => baseTemplate(`
  <h2>Offer Validity Extended</h2>
  <p>Dear ${name},</p>
  <p>We are pleased to inform you that the validity of your offer for the <strong>${jobTitle}</strong> position has been extended.</p>
  
  <div class="highlight-box">
    <p style="margin: 0; color: #166534; font-weight: 600;">We've updated your offer details. Please find the revised documents attached.</p>
  </div>

  <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
    <p style="margin: 0; color: #9a3412;"><strong>⏰ New Deadline:</strong> The offer is now valid until <strong>${new Date(validUntil).toLocaleDateString('en-GB')}</strong></p>
  </div>

  <p>You can review and accept the updated offer here:</p>
  
  <div style="text-align: center;">
    <a href="${link}" class="button">View Updated Offer</a>
  </div>

  ${hrContact ? `
  <div style="background-color: #f8f9fa; padding: 24px; border-radius: 12px; margin-top: 32px; border: 1px solid #e5e7eb;">
    <h4 style="margin: 0 0 12px 0; color: #374151;">📞 Questions?</h4>
    <p style="margin: 4px 0; color: #111827;"><strong>HR Contact:</strong> ${hrContact.name || 'HR Team'}</p>
    ${hrContact.email ? `<p style="margin: 4px 0; color: #111827;"><strong>Email:</strong> ${hrContact.email}</p>` : ''}
    ${hrContact.phone ? `<p style="margin: 4px 0; color: #111827;"><strong>Phone:</strong> ${hrContact.phone}</p>` : ''}
  </div>
  ` : ''}

  <p>Regards,<br><strong>FMPG Talent Acquisition</strong></p>
`, 'Offer Validity Extended');

exports.getOTPTemplate = (name, otp, purpose) => baseTemplate(`
  <h2>Verification Code</h2>
  <p>Hello ${name || 'Valued Candidate'},</p>
  <p>You are receiving this email because a <strong>${purpose}</strong> was requested for your account.</p>
  
  <div class="otp-card">
    <p style="text-transform: uppercase; font-size: 12px; font-weight: 800; color: #6b7280; letter-spacing: 2px; margin-bottom: 12px;">Your Security Code</p>
    <h1 class="otp-code">${otp}</h1>
  </div>

  <p style="color: #ef4444; font-size: 14px; font-weight: 600;">This code will expire in 10 minutes.</p>
  <p>If you did not request this code, please ignore this email or contact support if you have concerns about your account security.</p>
  
  <p>Stay Secure,<br><strong>FMPG Security Team</strong></p>
`, `${purpose} - FMPG`);

exports.getCertificateTemplate = (name, type, course) => baseTemplate(`
  <h2>Achievement Unlocked!</h2>
  <p>Dear ${name},</p>
  <p>Congratulations on successfully completing your <strong>${course}</strong> with FMPG!</p>
  <p>Your dedication and hard work have been recognized, and we are proud to issue your official <strong>${type}</strong>.</p>
  
  <div class="highlight-box" style="text-align: center; border: none; border-radius: 12px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">
    <p style="font-size: 18px; font-weight: 700; color: #166534; margin-bottom: 8px;">Verification Successful</p>
    <p style="margin: 0; color: #15803d;">Digital ID: FMPG-${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
  </div>

  <p>You can view and download your certificate anytime from your profile dashboard.</p>
  
  <div style="text-align: center;">
    <a href="https://careers.omsoftwares.in/certificates" class="button">View Certificate</a>
  </div>

  <p>We wish you the very best in your future endeavors!</p>
  <p>Warm Regards,<br><strong>FMPG Education Team</strong></p>
`, `${type} Issued - ${course}`);

exports.getWelcomeTemplate = (name) => baseTemplate(`
  <h2>Welcome to the Team, ${name}!</h2>
  <p>We are excited to have you join FMPG! This marks the beginning of an incredible journey together.</p>
  <p>Your onboarding process will begin shortly. Our team is already preparing everything to ensure you have a smooth and productive start.</p>
  
  <div class="highlight-box">
    <p style="margin: 0; font-weight: 600;">Keep an eye on your inbox for upcoming onboarding tasks and login credentials for our internal portals.</p>
  </div>

  <p>If you have any immediate questions, feel free to reach out.</p>
  <p>Welcome aboard!<br><strong>The FMPG Team</strong></p>
`, 'Welcome to FMPG');

exports.getApplicationConfirmationTemplate = (name, jobTitle) => baseTemplate(`
  <h2>Application Received</h2>
  <p>Hi ${name},</p>
  <p>Thank you for your interest in joining FMPG as a <strong>${jobTitle}</strong>. We've successfully received your application!</p>
  <p>Our talent acquisition team is currently reviewing your profile against our requirements. If your background aligns with our needs, we'll be in touch for the next steps.</p>
  
  <div class="info-grid">
    <div class="info-row">
      <div class="info-label">Position</div>
      <div class="info-value">${jobTitle}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Status</div>
      <div class="info-value">Under Initial Review</div>
    </div>
  </div>

  <p>You can track your application status anytime via your dashboard.</p>
  
  <div style="text-align: center;">
    <a href="https://careers.omsoftwares.in/my-applications" class="button">Track Application</a>
  </div>

  <p>Best of luck!<br><strong>FMPG Hiring Team</strong></p>
`, `Application Confirmation - ${jobTitle}`);

exports.getContractStatusTemplate = (name, position, status, message, comments) => baseTemplate(`
  <h2>Contract Status Update</h2>
  <p>Dear ${name},</p>
  <p>There has been an update regarding your employment contract for the <strong>${position}</strong> position.</p>
  
  <div class="highlight-box">
    <p style="margin: 0; font-weight: 700; color: #111827;">Status: ${status.replace('_', ' ')}</p>
    <p style="margin: 10px 0 0 0; color: #4b5563;">${message}</p>
  </div>

  ${comments ? `
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #92400e; margin: 0 0 8px 0; font-weight: 700; font-size: 14px; text-transform: uppercase;">HR Comments:</p>
      <p style="color: #92400e; margin: 0; line-height: 1.6;">${comments}</p>
    </div>
  ` : ''}

  <div style="text-align: center;">
    <a href="https://careers.omsoftwares.in/my-applications" class="button">View Contract Details</a>
  </div>

  <p>If you have any questions, please reply to this email or contact the HR department.</p>
  <p>Regards,<br><strong>FMPG HR Team</strong></p>
`, 'Contract Status Update');

exports.getContractSubmissionTemplate = (name, position) => baseTemplate(`
  <h2>Contract Submitted Successfully</h2>
  <p>Dear ${name},</p>
  <p>Thank you for submitting your employment contract for the <strong>${position}</strong> position. We have successfully received your documents.</p>
  
  <div class="highlight-box">
    <h3 style="margin: 0 0 12px 0; font-size: 16px;">Next Steps:</h3>
    <ul style="margin: 0; padding-left: 20px; color: #166534;">
      <li>Our HR team will review your submission (usually within 48 hours).</li>
      <li>You will receive an automated notification once the review is complete.</li>
      <li>Approved contracts will move forward to the final onboarding phase.</li>
    </ul>
  </div>

  <p>We appreciate your promptness in this process.</p>
  <p>Best Regards,<br><strong>FMPG Operations</strong></p>
`, 'Contract Submitted');

exports.getTerminationTemplate = (name, reason) => baseTemplate(`
  <h2>Employment Status Update</h2>
  <p>Dear ${name},</p>
  <p>This email is to formally notify you that your engagement with FMPG has been concluded.</p>
  
  ${reason ? `
    <div class="highlight-box" style="border-left-color: #6b7280; background-color: #f9fafb;">
      <p style="margin: 0; color: #374151;"><strong>Details:</strong> ${reason}</p>
    </div>
  ` : ''}

  <p>If you have any questions regarding your final settlement or documentation, please contact the HR department.</p>
  <p>Regards,<br><strong>Human Resources, FMPG</strong></p>
`, 'Employment Status Update');

exports.getBulkWelcomeTemplate = (name, email, password, role) => baseTemplate(`
  <h2>Welcome to FMPG, ${name}!</h2>
  <p>We are excited to have you on board! An official account has been created for you in our Employee Portal.</p>
  
  <div class="info-grid">
    <div class="info-row">
      <div class="info-label">Email</div>
      <div class="info-value">${email}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Temporary Password</div>
      <div class="info-value"><code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${password}</code></div>
    </div>
    <div class="info-row">
      <div class="info-label">Role</div>
      <div class="info-value">${role}</div>
    </div>
  </div>

  <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
    <p style="color: #b91c1c; margin: 0; font-size: 14px; font-weight: 700;">Action Required: For security reasons, please log in and change your password immediately.</p>
  </div>

  <div style="text-align: center;">
    <a href="https://careers.omsoftwares.in/login" class="button">Log In to Portal</a>
  </div>

  <p>Welcome to the family!<br><strong>FMPG Onboarding Team</strong></p>
`, 'Welcome to the Team');

exports.getRejectionTemplate = (name, position, reason) => baseTemplate(`
  <h2>Application Update</h2>
  <p>Dear ${name},</p>
  <p>Thank you for giving us the opportunity to review your application for the <strong>${position}</strong> position at FMPG.</p>
  <p>After careful consideration, we have decided not to proceed with your application at this time.</p>
  
  <div class="highlight-box" style="border-left-color: #6b7280; background-color: #f9fafb;">
    <p style="margin: 0; color: #374151;"><strong>Feedback:</strong> ${reason || 'Our team was impressed with your background, but we have decided to move forward with other candidates who more closely match our current requirements.'}</p>
  </div>

  <p>We appreciate your interest in FMPG and wish you the very best in your professional journey.</p>
  <p>Best Regards,<br><strong>FMPG Talent Acquisition</strong></p>
`, 'Application Update');
