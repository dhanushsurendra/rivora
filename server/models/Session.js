// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  guests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  scheduledAt: Date,
  isLive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Session', sessionSchema);
