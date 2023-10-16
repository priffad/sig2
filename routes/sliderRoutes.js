const { userAuthenticate } = require('../middleware/auth');
const express = require('express');
const multer = require('multer');
const Slider = require('../models/Slider');  

const router = express.Router();
const upload = multer();


router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
    const slider = new Slider({
        ...req.body,
        image: {
            data: req.file.buffer,
            contentType: req.file.mimetype
        }
    });
    try {
        await slider.save();
        res.status(201).send(slider);
    } catch (error) {
        res.status(400).send(error);
    }
});

// GET all sliders
router.get('/', async (req, res) => {
    try {
        const sliders = await Slider.find();
        res.status(200).send(sliders);
    } catch (error) {
        res.status(500).send(error);
    }
});

// GET specific slider by ID
router.get('/:id', async (req, res) => {
    try {
        const slider = await Slider.findById(req.params.id);
        if (!slider) {
            return res.status(404).send({ message: 'slider not found' });
        }
        res.status(200).send(slider);
    } catch (error) {
        res.status(500).send(error);
    }
});

// UPDATE slider by ID
router.patch('/:id', userAuthenticate, upload.single('image'), async (req, res) => {
    const updates = Object.keys(req.body);
    try {
        const slider = await Slider.findById(req.params.id);
        if (!slider) {
            return res.status(404).send({ message: 'slider not found' });
        }
        updates.forEach(update => slider[update] = req.body[update]);
        if (req.file) {
            slider.image.data = req.file.buffer;
            slider.image.contentType = req.file.mimetype;
        }
        await slider.save();
        res.status(200).send(slider);
    } catch (error) {
        res.status(400).send(error);
    }
});

// DELETE slider by ID
router.delete('/slider/:id', userAuthenticate, async (req, res) => {
    try {
        const slider = await Slider.findByIdAndDelete(req.params.id);
        if (!slider) {
            return res.status(404).send({ message: 'slider not found' });
        }
        res.status(200).send(slider);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;