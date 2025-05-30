const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },

  // Password login
  passwordHash: { type: String, required: false },

  // OAuth login
  provider: { type: String },  // e.g., 'google', 'github'
  providerId: { type: String }, // e.g., Google or GitHub user ID
  avatar: { type: String },    // Profile picture URL

  createdAt: { type: Date, default: Date.now },
});

// Unique compound index for OAuth
userSchema.index({ provider: 1, providerId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);
