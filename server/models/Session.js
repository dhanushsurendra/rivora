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

  videoChunks: {
    host: [{ type: String }],  // array of Cloudinary URLs or public IDs
    guest: [{ type: String }],
  },

  mergedVideo: {
    host: { type: String },    // optional: URL of host's full merged video
    guest: { type: String },   // optional: URL of guest's full merged video
    finalMerged: { type: String }, // optional: full final stitched output
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Session', sessionSchema);
