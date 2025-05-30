const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  accepted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Invite', inviteSchema);
