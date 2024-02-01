const express = require('express');
const multer = require('multer');
const Slider = require('../models/Slider');
const { userAuthenticate } = require('../middleware/auth');
const { uploadImageToS3 } = require('../services/s3Service'); // Sesuaikan dengan lokasi file Anda

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        // Log file dan body untuk debugging
        console.log('Received file:', req.file);
        console.log('Received body:', req.body);

        let imageUrl = null;
        if (req.file) {
            imageUrl = await uploadImageToS3(req.file.buffer, req.file.mimetype);
        }

        const slider = new Slider({
            ...req.body,
            imageUrl: imageUrl
        });

        await slider.save();
        res.status(201).send(slider);
    } catch (error) {
        console.error('Error in POST /sliders:', error);
        res.status(400).send({ message: 'Error when creating slider', error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const sliders = await Slider.find();
        res.status(200).send(sliders);
    } catch (error) {
        console.error('Error in GET /sliders:', error);
        res.status(500).send({ message: 'Error fetching sliders', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const slider = await Slider.findById(req.params.id);
        if (!slider) {
            return res.status(404).send({ message: 'Slider not found' });
        }
        res.status(200).send(slider);
    } catch (error) {
        console.error('Error in GET /sliders/:id:', error);
        res.status(500).send({ message: 'Error fetching slider', error: error.message });
    }
});

router.patch('/:id', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        // Log file dan body untuk debugging
        console.log('Received file:', req.file);
        console.log('Received body:', req.body);

        const slider = await Slider.findById(req.params.id);
        if (!slider) {
            return res.status(404).send({ message: 'Slider not found' });
        }

        const updates = Object.keys(req.body);
        updates.forEach(update => slider[update] = req.body[update]);

        if (req.file) {
            const newImageUrl = await uploadImageToS3(req.file.buffer, req.file.mimetype);
            slider.imageUrl = newImageUrl;
        }

        await slider.save();
        res.status(200).send(slider);
    } catch (error) {
        console.error('Error in PATCH /sliders/:id:', error);
        res.status(400).send({ message: 'Error updating slider', error: error.message });
    }
});

router.delete('/:id', userAuthenticate, async (req, res) => {
    try {
        const slider = await Slider.findByIdAndDelete(req.params.id);
        if (!slider) {
            return res.status(404).send({ message: 'Slider not found' });
        }
        res.status(200).send({ message: 'Slider deleted' });
    } catch (error) {
        console.error('Error in DELETE /sliders/:id:', error);
        res.status(500).send({ message: 'Error deleting slider', error: error.message });
    }
});

module.exports = router;
