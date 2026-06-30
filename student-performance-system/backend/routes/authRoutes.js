const express = require('express');
const passport = require('../utils/passportConfig');
const {
  login,
  register,
  logout,
  getMe,
  getFaculties,
  googleCallback,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Standard auth ──────────────────────────────────────────────────────────
router.post('/login', login);
router.post('/logout', protect, logout);                          // Quick Win #1
router.post('/register', protect, authorize('admin'), register);
router.get('/me', protect, getMe);
router.get('/faculty', protect, authorize('admin'), getFaculties);

// ── Password Reset ─────────────────────────────────────────────────────────
router.post('/forgot-password', forgotPassword);                  // Quick Win #4
router.put('/reset-password', resetPassword);                     // Quick Win #4

// ── Google OAuth 2.0 ───────────────────────────────────────────────────────
// Step 1: Redirect user to Google consent screen
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step 2: Google redirects back here with auth code
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_failed`, session: false }),
  googleCallback                                                  // Quick Win #3
);

module.exports = router;
