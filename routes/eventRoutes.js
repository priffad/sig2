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
router.get('/', async (req, res) => {
    try {
        const events = await Event.find();
        const transformedEvents = events.map(event => ({
            ...event._doc,
            image: event.image ? {
                data: event.image.data.toString('base64'),
                contentType: event.image.contentType
            } : null
        }));
        res.status(200).send(transformedEvents);
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
        const transformedEvent = {
            ...event._doc,
            image: event.image ? {
                data: event.image.data.toString('base64'),
                contentType: event.image.contentType
            } : null
        };
        res.status(200).send(transformedEvent);
    } catch (error) {
        res.status(500).send(error);
    }
});
router.patch('/:id', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).send({ message: 'Event not found' });
        }

        const updates = Object.keys(req.body);
        updates.forEach(update => event[update] = req.body[update]);


        if (req.file) {
            event.image = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
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