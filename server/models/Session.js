const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ['host', 'guest', 'audience'], required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
});

const audienceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
});

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
  createdAt: { type: Date, default: Date.now },

  audience: [audienceSchema],

  chatMessages: [chatMessageSchema], 
});

module.exports = mongoose.model('Session', sessionSchema);
