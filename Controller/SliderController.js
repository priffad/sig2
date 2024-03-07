const express = require('express');
const multer = require('multer');
const Slider = require('../models/Slider');
const { userAuthenticate } = require('../middleware/auth');
const { getCloudinaryStorage, cloudinary } = require('../cloudinaryConfig');

const router = express.Router();
const storage = getCloudinaryStorage('slider_images'); 
const upload = multer({ storage: storage });

router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'No image file received' });
        }

        const slider = new Slider({
            ...req.body,
            imageUrl: req.file.path, 
        });

        await slider.save();
        res.status(201).send(slider);
    } catch (error) {
        res.status(400).send({ message: 'Error when creating slider' });
    }
});

router.get('/', async (req, res) => {
    try {
        const sliders = await Slider.find();
        res.status(200).send(sliders);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching sliders' });
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
        res.status(500).send({ message: 'Error fetching slider' });
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
        res.status(500).send({ message: 'Error deleting slider' });
    }
});

module.exports = router;
