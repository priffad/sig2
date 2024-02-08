const express = require('express');
const multer = require('multer');
const { userAuthenticate } = require('../middleware/auth');
const Event = require('../models/Event');
const { getCloudinaryStorage, cloudinary } = require('../cloudinaryConfig');

// Setup multer untuk menggunakan cloudinary storage
const storage = getCloudinaryStorage('events');
const upload = multer({ storage });

const router = express.Router();

router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        const event = new Event({
            ...req.body,
            imageUrl: req.file ? req.file.path : ''
        });
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

router.get('/', async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).send(events);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).send({ message: 'Event not found' });
        }
        res.status(200).send(event);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/:id', userAuthenticate, upload.single('image'), async (req, res) => {
    const { id } = req.params;

    const eventUpdates = req.body;
    if (req.file) {
        eventUpdates.imageUrl = req.file.path;
    }

    try {
        const updatedEvent = await Event.findByIdAndUpdate(id, eventUpdates, { new: true });
        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating event", error: error.toString() });
    }
});


router.delete('/:id', userAuthenticate, async (req, res) => {
    try {
        const event = await Event.findByIdAndRemove(req.params.id);
        if (event && event.imageUrl) {
            const publicId = event.imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }
        res.status(200).json({ message: 'event deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting event", error: error.toString() });
    }
});
module.exports = router;
