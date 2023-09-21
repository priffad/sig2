const express = require('express');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
    const events = await Event.find();
    res.send(events);
});

// Create a new event (Admin only)
router.post('/', authMiddleware, async (req, res) => {
    const { name, date, location, description } = req.body;

    let event = new Event({
        name,
        date,
        location,
        description
    });

    try {
        event = await event.save();
        res.send(event);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Update an event (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    const { name, date, location, description } = req.body;
    const event = await Event.findByIdAndUpdate(req.params.id, {
        name,
        date,
        location,
        description
    }, { new: true });

    if (!event) return res.status(404).send('The event with the given ID was not found.');

    res.send(event);
});

module.exports = router;
