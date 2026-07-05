const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables — triggered restart
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize passport config (Google OAuth)
const passport = require('./utils/passportConfig');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const systemRoutes = require('./routes/systemRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const assessmentTemplateRoutes = require('./routes/assessmentTemplateRoutes');
const aiRoutes = require('./routes/aiRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const messageRoutes = require('./routes/messageRoutes');
const academicRoutes = require('./routes/academicRoutes');
const facultyRoutes = require('./routes/facultyRoutes');

const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// ─── Security & Logging Middleware ───────────────────────────────────────────
app.use(helmet());

const defaultClientOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const configuredClientOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultClientOrigins, ...configuredClientOrigins])];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
};
app.use(cors(corsOptions));

// Log HTTP requests in dev/prod
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Rate Limiting (prevent DOS / brute-force)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window for dev
  max: 5000, // 5000 requests per minute
  message: { success: false, error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// Specific stricter limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Allow 100 logins in dev
  message: { success: false, error: 'Too many login attempts. Please try again later.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Middlewares
app.use(express.json());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/assessment-templates', assessmentTemplateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/faculty', facultyRoutes);

// Health Check Route (used by Render/uptime bots)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    dbConnected: mongoose.connection.readyState === 1
  });
});

// Base Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Student Performance Prediction System API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// MongoDB Connection & Seeding
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_ATLAS_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student-performance-db';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully.');

    // Seeding strategy:
    // - Default: DO NOT wipe existing data on every start.
    // - Enable wipe+seed explicitly via SEED_ON_START=true
    //   (useful for dev, but never for production).
    const seedOnStart = (process.env.SEED_ON_START || '').toLowerCase() === 'true';

    if (seedOnStart) {
      const wipeAndSeed = require('./utils/seeder');
      await wipeAndSeed();
    } else {
      console.log('Skipping wipe+seed on startup. Set SEED_ON_START=true to enable.');
    }

    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err.message);
  });
