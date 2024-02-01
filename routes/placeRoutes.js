// placeRoutes.js

const express = require('express');
const multer = require('multer');
const Place = require('../models/Place');
const { userAuthenticate } = require('../middleware/auth');
const { uploadImageToS3 } = require('../services/s3Service'); // Pastikan ini sesuai dengan lokasi file Anda

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', userAuthenticate, upload.array('image', 4), async (req, res) => {
    try {
        const placeImages = req.files.length ? await Promise.all(
            req.files.map(file => uploadImageToS3(file.buffer, file.mimetype))
        ) : [];

        const place = new Place({
            name: req.body.name,
            category: req.body.category,
            description: req.body.description,
            address: req.body.address,
            lat: req.body.lat,
            lng: req.body.lng,
            images: placeImages
        });

        await place.save();
        res.status(201).send(place);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// Endpoint untuk mendapatkan semua tempat
router.get('/', async (req, res) => {
    try {
        const places = await Place.find();
        res.send(places);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error fetching places", error: error.message });
    }
});

// Endpoint untuk mendapatkan tempat berdasarkan ID
router.get('/:id', async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) {
            return res.status(404).send('Place not found');
        }
        res.send(place);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

// Endpoint untuk memperbarui tempat
router.put('/:id', userAuthenticate, upload.array('newImages', 4), async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) {
            return res.status(404).send('Place not found');
        }

        // Update tempat
        place.name = req.body.name || place.name;
        place.category = req.body.category || place.category;
        place.description = req.body.description || place.description;
        place.address = req.body.address || place.address;
        place.lat = req.body.lat || place.lat;
        place.lng = req.body.lng || place.lng;

        // Handle image updates
        if (req.files && req.files.length > 0) {
            const newImages = await Promise.all(
                req.files.map(file => uploadImageToS3(file.buffer, file.mimetype))
            );
            place.images.push(...newImages);
        }

        await place.save();
        res.send(place);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

// Endpoint untuk menghapus tempat
router.delete('/:id', userAuthenticate, async (req, res) => {
    try {
        const place = await Place.findByIdAndDelete(req.params.id);
        if (!place) {
            return res.status(404).send('Place not found');
        }
        res.send(place);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

// Endpoint untuk like/unlike tempat
router.patch('/:placeId/like', userAuthenticate, async (req, res) => {
    try {
        const place = await Place.findById(req.params.placeId);
        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        const index = place.likes.indexOf(req.user._id);
        if (index === -1) {
            place.likes.push(req.user._id);
        } else {
            place.likes.splice(index, 1);
        }
        await place.save();

        res.status(200).json({
            status: index === -1 ? 'liked' : 'unliked',
            likes: place.likes.length,
            place: {
                ...place._doc,
                images: place.images // Adjust sesuai dengan kebutuhan Anda
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to like the place', error: error.message });
    }
});

module.exports = router;
