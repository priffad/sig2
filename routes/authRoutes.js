const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    let admin = new Admin({
        username,
        password
    });

    try {
        admin = await admin.save();
        res.send(admin);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).send('Invalid username or password.');

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) return res.status(400).send('Invalid username or password.');

    const token = jwt.sign({ id: admin._id }, process.env.SECRET_KEY);
    res.send(token);
});

module.exports = router;
