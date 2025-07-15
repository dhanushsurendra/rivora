const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },

  passwordHash: { type: String, required: false },

  provider: { type: String },  
  providerId: { type: String }, 
  avatar: { type: String },    

  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ provider: 1, providerId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);
