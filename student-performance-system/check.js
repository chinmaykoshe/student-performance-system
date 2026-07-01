const mongoose = require('mongoose');
const User = require('./backend/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/student-performance-db').then(async () => {
  const users = await User.find({}).select('+password');
  console.log('Found Users:', users.map(u => ({ email: u.email, password: u.password })));
  process.exit(0);
}).catch(console.error);
