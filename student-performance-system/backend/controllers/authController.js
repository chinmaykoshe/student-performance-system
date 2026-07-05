const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Helper to sign JWT and return
const sendTokenResponse = (user, statusCode, res, profile = null) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'secret_key_123',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    profile
  });
};

// @desc    Register a user (Usually invoked by Admin for creating new users)
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    user = await User.create({ name, email, password, role });

    let profile = null;
    if (role === 'faculty') {
      if (!department) {
        return res.status(400).json({ success: false, error: 'Department is required for faculty' });
      }
      profile = await Faculty.create({ user: user._id, name, email, department });
    } else if (role === 'student') {
      profile = await Student.create({
        name,
        email,
        rollNumber: 'NEW-' + Math.floor(Math.random() * 10000),
        department: department || 'Computer Applications (MCA)',
        semester: 1,
        attendancePercentage: 0,
        assignmentMarks: 0,
        internalMarks: 0,
        previousCGPA: 0,
        studyHours: 0,
        backlogs: 0
      });
      // Generate initial prediction
      const { predictStudentPerformance } = require('../utils/predictionService');
      const predictionResult = await predictStudentPerformance(profile);
      profile.prediction = {
        result: predictionResult.result,
        confidence: predictionResult.confidence,
        suggestions: predictionResult.suggestions,
        predictedAt: new Date()
      };
      await profile.save();
    }

    sendTokenResponse(user, 201, res, profile);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`[LOGIN FAILED] User not found for email: ${email}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    console.log(`[LOGIN MATCH CHECK] Email: ${email} | Input Pass: "${password}" | DB Pass: "${user.password}" | Match: ${isMatch}`);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ email: user.email });
    } else if (user.role === 'faculty') {
      profile = await Faculty.findOne({ email: user.email });
    }

    sendTokenResponse(user, 200, res, profile);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Logout user (stateless — client drops the token; server returns confirmation)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = null;

    if (user.role === 'student') {
      profile = await Student.findOne({ email: user.email });
    } else if (user.role === 'faculty') {
      profile = await Faculty.findOne({ email: user.email });
    }

    res.status(200).json({ success: true, user, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all faculty profiles
// @route   GET /api/auth/faculty
// @access  Private/Admin
exports.getFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find({});
    res.status(200).json({ success: true, count: faculties.length, data: faculties });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete a faculty profile and user
// @route   DELETE /api/auth/faculty/:id
// @access  Private/Admin
exports.deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, error: 'Faculty not found' });
    }
    
    await User.findByIdAndDelete(faculty.user);
    await Faculty.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ success: true, message: 'Faculty revoked successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUICK WIN #3 — Google OAuth 2.0 callback handler
// Called by passport after successful Google login
// ─────────────────────────────────────────────────────────────────────────────
exports.googleCallback = async (req, res) => {
  try {
    // req.user is set by passport strategy
    const user = req.user;
    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ email: user.email });
    } else if (user.role === 'faculty') {
      profile = await Faculty.findOne({ email: user.email });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret_key_123',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    // Redirect to frontend with token in query param; frontend stores it
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/oauth-callback?token=${token}&role=${user.role}`);
  } catch (err) {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUICK WIN #4 — Password Reset (Forgot Password & Reset Password)
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Send password reset link to email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Please provide your email address.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Do NOT reveal whether the email exists (security best practice)
      return res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    }

    // Generate a signed JWT as the reset token (expires in 15 mins)
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_RESET_SECRET || process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Send email via nodemailer (falls back gracefully if SMTP is not configured)
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@studentprediction.com',
        to: user.email,
        subject: 'Password Reset Request — Student Performance System',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e3a8a; margin-bottom: 8px;">Password Reset</h2>
            <p style="color: #64748b; font-size: 14px;">You requested a password reset. Click the button below. This link expires in <strong>15 minutes</strong>.</p>
            <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #3b82f6; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Reset Password</a>
            <p style="color: #94a3b8; font-size: 12px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
          </div>
        `
      });
    } catch (emailErr) {
      // Log but don't fail the request — SMTP may not be configured in dev
      console.warn('Password reset email could not be sent:', emailErr.message);
      console.log('Reset URL (dev fallback):', resetUrl);
    }

    return res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    // Verify the JWT reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_RESET_SECRET || process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Reset link is invalid or has expired.' });
    }

    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Reset link is invalid or has expired.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update password (authenticated user)
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required.' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update logged-in user's profile (name only for security)
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.status(200).json({ success: true, message: 'Profile updated successfully.', user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
