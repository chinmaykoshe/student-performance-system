const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path as necessary
require('dotenv').config();

const resetPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student-performance', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to DB');

    const users = await User.find({});
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
      if (user.role === 'admin') {
        user.password = 'admin123';
      } else {
        // For students and faculty, set password to email@123 as requested or as per seed
        user.password = `${user.email}@123`;
      }
      
      // Save user to trigger the pre-save hook which hashes the plain text password
      await user.save();
      console.log(`Reset password for ${user.email}`);
    }

    console.log('All passwords reset successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting passwords:', error);
    process.exit(1);
  }
};

resetPasswords();
