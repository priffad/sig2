const { userAuthenticate } = require('../middleware/auth');
const express = require('express');
const multer = require('multer');
const Event = require('../models/Event');  

const router = express.Router();
const upload = multer();


router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
    const article = new Event({
        ...req.body,
        image: {
            data: req.file.buffer,
            contentType: req.file.mimetype
        }
    });
    try {
        await article.save();
        res.status(201).send(article);
    } catch (error) {
        res.status(500).send(error);
    }
});
// GET all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).send(events);
    } catch (error) {
        res.status(500).send(error);
    }
});

// GET specific event by ID
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

// UPDATE event by ID
router.patch('/:id', userAuthenticate, upload.single('image'), async (req, res) => {
    const updates = Object.keys(req.body);
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).send({ message: 'Event not found' });
        }
        updates.forEach(update => event[update] = req.body[update]);
        if (req.file) {
            event.image.data = req.file.buffer;
            event.image.contentType = req.file.mimetype;
        }
        await event.save();
        res.status(200).send(event);
    } catch (error) {
        res.status(400).send(error);
    }
});

// DELETE event by ID
router.delete('/:id', userAuthenticate, async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).send({ message: 'Event not found' });
        }
        res.status(200).send(event);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;