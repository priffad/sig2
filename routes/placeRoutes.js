const express = require('express');
const Place = require('../models/Place');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all places
router.get('/', async (req, res) => {
    const places = await Place.find().populate('category');
    res.send(places);
});

// Create a new place (Admin only)
router.post('/', authMiddleware, async (req, res) => {
    const { name, category, description, image, lat, lng } = req.body;

    let place = new Place({
        name,
        category,
        description,
        image,
        lat,
        lng
    });

    try {
        place = await place.save();
        res.send(place);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Update a place (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    const { name, category, description, image, lat, lng } = req.body;
    const place = await Place.findByIdAndUpdate(req.params.id, {
        name,
        category,
        description,
        image,
        lat,
        lng
    }, { new: true });

    if (!place) return res.status(404).send('The place with the given ID was not found.');

    res.send(place);
});

// Delete a place (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    const place = await Place.findByIdAndRemove(req.params.id);

    if (!place) return res.status(404).send('The place with the given ID was not found.');

    res.send(place);
});

module.exports = router;
