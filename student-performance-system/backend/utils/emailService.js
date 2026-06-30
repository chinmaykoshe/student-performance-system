const nodemailer = require('nodemailer');

// Create a transporter using environment variables or a fallback Ethereal/Local SMTP
const getTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // If not configured, print to console as fallback and return null
    return null;
  }
};

/**
 * Sends an email notification to student/parent and faculty
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body plain text
 * @param {string} html - Email body HTML
 */
exports.sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.log('----------------- EMAIL SIMULATION -----------------');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log('----------------------------------------------------');
    return { simulated: true, success: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || '"Student Performance System" <noreply@studentprediction.com>',
      to,
      subject,
      text,
      html
    });

    console.log(`Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Trigger warning email for low attendance
 */
exports.sendLowAttendanceAlert = async (student) => {
  const subject = `Academic Alert: Low Attendance - ${student.name} (${student.rollNumber})`;
  const text = `Dear Student,\n\nYour current attendance is ${student.attendancePercentage}%, which is below the minimum required threshold of 75%. Please increase your class attendance to avoid academic penalties.\n\nBest regards,\nAdministration`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px;">
      <h2 style="color: #d32f2f;">Academic Performance Warning</h2>
      <p>Dear <strong>${student.name}</strong> (${student.rollNumber}),</p>
      <p>This is to notify you that your current attendance in <strong>Semester ${student.semester}</strong> is <strong>${student.attendancePercentage}%</strong>.</p>
      <p style="background-color: #ffebee; color: #c62828; padding: 10px; border-radius: 4px; font-weight: bold;">
        Alert: Attendance is below the mandatory 75% threshold!
      </p>
      <p>Please contact your assigned faculty or mentor as soon as possible and attend regular classes to improve your attendance.</p>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #888;">This is an automated academic alert system. Please do not reply directly to this email.</p>
    </div>
  `;
  return exports.sendEmail({ to: student.email, subject, text, html });
};

/**
 * Trigger warning email for low internal marks
 */
exports.sendLowMarksAlert = async (student) => {
  const subject = `Academic Alert: Low Internal Marks - ${student.name} (${student.rollNumber})`;
  const text = `Dear Student,\n\nYour internal marks are currently ${student.internalMarks}/100, which is below the threshold of 40%. Please seek academic guidance from your course faculty.\n\nBest regards,\nAdministration`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px;">
      <h2 style="color: #d32f2f;">Academic Performance Warning</h2>
      <p>Dear <strong>${student.name}</strong> (${student.rollNumber}),</p>
      <p>This is to notify you that your current internal marks are <strong>${student.internalMarks}/100</strong>.</p>
      <p style="background-color: #ffebee; color: #c62828; padding: 10px; border-radius: 4px; font-weight: bold;">
        Alert: Internal examination marks are below the 40% passing threshold!
      </p>
      <p>We advise you to meet with your course instructor to discuss academic support, remedial classes, or tutoring options.</p>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #888;">This is an automated academic alert system. Please do not reply directly to this email.</p>
    </div>
  `;
  return exports.sendEmail({ to: student.email, subject, text, html });
};

/**
 * Trigger prediction generated notification
 */
exports.sendPredictionNotification = async (student) => {
  const resultText = student.prediction.result === 'Pass' ? 'satisfactory (Pass)' : 'at risk (Fail)';
  const subject = `Academic Performance Analysis Generated - ${student.name}`;
  const text = `Dear Student,\n\nYour performance prediction has been updated. Your status is predicted as: ${student.prediction.result} with ${student.prediction.confidence}% confidence.\n\nSuggestions:\n${student.prediction.suggestions.join('\n')}\n\nBest regards,\nAdministration`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px;">
      <h2 style="color: #1976d2;">Academic Performance Report</h2>
      <p>Dear <strong>${student.name}</strong> (${student.rollNumber}),</p>
      <p>An AI-powered academic performance review has been completed for your academic profile in <strong>Semester ${student.semester}</strong>.</p>
      <div style="background-color: ${student.prediction.result === 'Pass' ? '#e8f5e9' : '#ffebee'}; 
                  color: ${student.prediction.result === 'Pass' ? '#2e7d32' : '#c62828'}; 
                  padding: 15px; border-radius: 6px; margin: 15px 0;">
        <h3 style="margin-top: 0;">Prediction Result: ${student.prediction.result}</h3>
        <p style="margin-bottom: 0;"><strong>Confidence Score:</strong> ${student.prediction.confidence}%</p>
      </div>
      <h4>Actionable Recommendations:</h4>
      <ul>
        ${student.prediction.suggestions.map(s => `<li>${s}</li>`).join('')}
      </ul>
      <p>Please log in to your dashboard to download the complete performance report card.</p>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #888;">This is an automated academic alert system. Please do not reply directly to this email.</p>
    </div>
  `;
  return exports.sendEmail({ to: student.email, subject, text, html });
};
