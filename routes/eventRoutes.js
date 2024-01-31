// routes/eventRoutes.js

const express = require('express');
const multer = require('multer');
const Event = require('../models/Event');
const { userAuthenticate } = require('../middleware/auth');
const { uploadImageToS3 } = require('../services/s3Service'); // Sesuaikan dengan lokasi file Anda

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        let imageUrl = null;
        if (req.file) {
            imageUrl = await uploadImageToS3(req.file.buffer, req.file.mimetype);
        }

        const event = new Event({
            ...req.body,
            imageUrl: imageUrl
        });

        await event.save();
        res.status(201).send(event);
    } catch (error) {
        res.status(500).send(error);
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
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).send({ message: 'Event not found' });
        }

        const updates = Object.keys(req.body);
        updates.forEach(update => event[update] = req.body[update]);

        if (req.file) {
            const newImageUrl = await uploadImageToS3(req.file.buffer, req.file.mimetype);
            event.imageUrl = newImageUrl;
        }

        await event.save();
        res.status(200).send(event);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/:id', userAuthenticate, async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).send({ message: 'Event not found' });
        }
        res.status(200).send({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
