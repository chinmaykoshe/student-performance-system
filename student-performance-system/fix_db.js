const mongoose = require('mongoose');
const User = require('./backend/models/User');
const bcrypt = require('bcryptjs');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/student-performance-db');
  console.log('--- DB Users Check ---');
  const faculty = await User.findOne({ email: 'faculty@system.com' }).select('+password');
  
  if (!faculty) {
    console.log('Faculty user NOT FOUND in database!');
  } else {
    console.log('Faculty Password in DB:', faculty.password);
    const match = await bcrypt.compare('faculty@system.com@123', faculty.password);
    console.log('Does faculty@system.com@123 match?', match);
    
    // Let's fix it right here if it does not match
    if (!match) {
      console.log('Fixing faculty password now...');
      faculty.password = 'faculty@system.com@123';
      await faculty.save();
      console.log('Faculty password fixed.');
    }
  }

  const admin = await User.findOne({ email: 'admin@system.com' }).select('+password');
  if (admin) {
    const adminMatch = await bcrypt.compare('Admin@123', admin.password);
    console.log('Does Admin@123 match?', adminMatch);
    if (!adminMatch) {
      console.log('Fixing admin password now...');
      admin.password = 'Admin@123';
      await admin.save();
      console.log('Admin password fixed.');
    }
  }

  mongoose.disconnect();
}
check();
