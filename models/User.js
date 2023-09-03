// Import required modules
const mongoose = require('mongoose');

// Define user schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  facebookPage: {
    name: String,
    email: String,
    coverPage: String
  }
});

// Create user model
const User = mongoose.model('User', userSchema);

// Export user model
module.exports = User;