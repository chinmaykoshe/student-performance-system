const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

/**
 * Google OAuth 2.0 Strategy (Quick Win #3)
 * 
 * To enable this:
 * 1. Go to console.cloud.google.com → Credentials → Create OAuth Client
 * 2. Set authorized redirect URI: http://localhost:5000/api/auth/google/callback
 * 3. Copy Client ID + Secret to .env as GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder_secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email returned from Google profile'), null);
        }

        // Check if user already exists by googleId or email
        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

        if (!user) {
          // Auto-register as student if not found
          user = await User.create({
            name: profile.displayName || 'Google User',
            email,
            password: Math.random().toString(36).slice(-12) + 'Aa1!', // strong random password
            role: 'student',
            googleId: profile.id
          });
        } else if (!user.googleId) {
          // Link existing email-password account with Google
          user.googleId = profile.id;
          await user.save({ validateBeforeSave: false });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
