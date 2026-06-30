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
const aiRoutes = require('./routes/aiRoutes');
const resumeRoutes = require('./routes/resumeRoutes');

const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// ─── Security & Logging Middleware ───────────────────────────────────────────
app.use(helmet());

// Log HTTP requests in dev/prod
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Rate Limiting (prevent DOS / brute-force)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api', apiLimiter);

// Specific stricter limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40, // Limit login/register attempts
  message: { success: false, error: 'Too many login attempts. Please try again after 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Middlewares
app.use(express.json());
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/resume', resumeRoutes);

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
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student-performance-db';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully.');
    
    // Seed initial users
    await seedDatabase();
    
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err.message);
  });

// Database Seeding Helper
async function seedDatabase() {
  const User = require('./models/User');
  const Faculty = require('./models/Faculty');
  
  try {
    // 1. Seed Admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      const adminUser = await User.create({
        name: 'System Admin',
        email: 'admin@system.com',
        password: 'Admin@123', // Will be hashed automatically by pre-save hook
        role: 'admin'
      });
      if (process.env.NODE_ENV !== 'production') {
        console.log('Seeded default Admin user: admin@system.com / Admin@123');
      } else {
        console.log('Seeded default Admin user account.');
      }
    }

    // 2. Seed Faculty
    const facultyCount = await User.countDocuments({ role: 'faculty' });
    if (facultyCount === 0) {
      const facultyUser = await User.create({
        name: 'Dr. Sarah Connor',
        email: 'faculty@system.com',
        password: 'Faculty@123',
        role: 'faculty'
      });

      await Faculty.create({
        user: facultyUser._id,
        name: facultyUser.name,
        email: facultyUser.email,
        department: 'Computer Applications (MCA)'
      });
      if (process.env.NODE_ENV !== 'production') {
        console.log('Seeded default Faculty user: faculty@system.com / Faculty@123');
      } else {
        console.log('Seeded default Faculty user account.');
      }
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
}
