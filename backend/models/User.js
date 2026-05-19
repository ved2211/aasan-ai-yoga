const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  durationMinutes: { type: Number, required: true },
  accuracyPercentage: { type: Number, required: true },
  exertionLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  weightKg: { type: Number, required: true },
  sessions: [sessionSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
