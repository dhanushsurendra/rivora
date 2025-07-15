const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['audio', 'video'], required: true },
  url: { type: String, required: true },
  duration: Number, 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Track', trackSchema);
