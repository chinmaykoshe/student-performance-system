const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const fixPasswords = async () => {
  try {
    console.log('--- Checking for incorrect unhashed passwords ---');
    const users = await User.find({});
    for (const user of users) {
      if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        console.log(`Fixing password for user: ${user.email}`);
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();
        console.log(`Successfully fixed password for ${user.email}`);
      }
    }
    console.log('--- Password check complete ---');
  } catch (err) {
    console.error('Error fixing passwords:', err);
  }
};

module.exports = fixPasswords;
