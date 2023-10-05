const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  // Check if username already exists
  let user = await User.findOne({ username });
  if (user) return res.status(400).send({ error: 'Username already exists' });

  user = new User({ username, password });

  // Hash password before saving
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);

  try {
    await user.save();
    res.status(201).send({ message: 'Registered successfully' });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) return res.status(400).send({ error: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) return res.status(400).send({ error: 'Invalid credentials' });

  const token = jwt.sign({ _id: user._id, username: user.username }, process.env.SECRET_KEY);
  res.send({ token });
});

// You can add more routes (e.g., updating profile, etc.)

module.exports = router;
