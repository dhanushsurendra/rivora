const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  expiresAt: Date,
});

module.exports = mongoose.model('Plan', planSchema);
