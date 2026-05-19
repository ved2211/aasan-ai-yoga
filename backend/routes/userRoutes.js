const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register a new user (Placeholder for Auth)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, weightKg } = req.body;
    // Note: Add proper password hashing with bcryptjs here before production
    const newUser = new User({ name, email, password, weightKg });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save a new yoga session result
router.post('/:userId/sessions', async (req, res) => {
  try {
    const { durationMinutes, accuracyPercentage, exertionLevel } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) return res.status(404).json({ message: "User not found" });

    user.sessions.push({ durationMinutes, accuracyPercentage, exertionLevel });
    await user.save();
    
    res.status(201).json({ message: "Session saved", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile and session history
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
