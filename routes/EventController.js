const express = require('express');
const multer = require('multer');
const Event = require('../models/Event');
const { userAuthenticate } = require('../middleware/auth');
const { getCloudinaryStorage } = require('../cloudinaryConfig');

const router = express.Router();
const storage = getCloudinaryStorage('events');
const upload = multer({ storage });

// Membuat event baru
router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        const event = new Event({
            ...req.body,
            imageUrl: req.file ? req.file.path : '',
        });
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

// Mendapatkan semua event
router.get('/', async (req, res) => {
    try {
        const events = await Event.find({});
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: "Error fetching events", error: error.toString() });
    }
});

// Mendapatkan event berdasarkan ID
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error fetching event", error: error.toString() });
    }
});

// Update event
router.patch('/:id', userAuthenticate, upload.single('image'), async (req, res) => {
    const updates = req.body;
    if (req.file) {
        updates.imageUrl = req.file.path;
    }
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error updating event", error: error.toString() });
    }
});

// Delete event
router.delete('/:id', userAuthenticate, async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: "Error deleting event", error: error.toString() });
    }
});

// Mendapatkan event yang dibookmark oleh pengguna
router.get('/bookmarkedEvents/:userId', userAuthenticate, async (req, res) => {
    const { userId } = req.params;
    try {
        const events = await Event.find({ bookmarkedBy: userId });
        res.status(200).json(events);
    } catch (error) {
        res.status(500).send({ message: 'Internal server error', error: error.message });
    }
});

// Bookmark atau unbookmark event
router.patch('/bookmark/:eventId', userAuthenticate, async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user._id; // 
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).send({ message: 'Event not found' });
        }
        const index = event.bookmarkedBy.indexOf(userId);
        let message = '';
        if (index === -1) {
            event.bookmarkedBy.push(userId);
            message = 'Event added to bookmarks successfully';
        } else {
            event.bookmarkedBy.splice(index, 1);
            message = 'Event removed from bookmarks successfully';
        }
        await event.save();
        res.status(200).send({ message });
    } catch (error) {
        res.status(500).send({ message: 'Failed to update event bookmark', error: error.toString() });
    }
});


module.exports = router;
