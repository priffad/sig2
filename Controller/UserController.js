const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const { userAuthenticate } = require('../middleware/auth');
const router = express.Router();


router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  

  let user = await User.findOne({ username });
  if (user) return res.status(400).send({ error: 'Username already exists' });

  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
} catch (error) {
    res.status(400).send(error);
}
});


router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      if (!user) {
          return res.status(400).send({ error: 'Invalid login credentials' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).send({ error: 'Invalid login credentials' });
      }
      const token = jwt.sign({ _id: user._id }, process.env.SECRET_KEY);
  
    
      res.send({ token: token, userId: user._id }); // Mengembalikan token dan userId
    } catch (error) {
      res.status(500).send(error);
    }
  });

router.get('/register/last-7-days', async (req, res) => {
    const today = new Date();
    const last7Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

    try {
        const registrations = await User.aggregate([
            { $match: { createdAt: { $gte: last7Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).send(registrations);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
