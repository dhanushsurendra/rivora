const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  guest: {
    name: { type: String },
    email: { type: String },
    token: { type: String },
    hasJoined: { type: Boolean, default: false },
  },

  scheduledAt: { type: Date, required: true },
  isLive: { type: Boolean, default: false },

  roomId: { type: String, required: true }, 

  mergedVideo: {
    host: { type: String },
    guest: { type: String },
    finalMerged: { type: String },
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Session', sessionSchema);
