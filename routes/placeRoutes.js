const express = require('express');
const multer = require('multer');
const { cloudinary } = require('../cloudinaryConfig'); // Asumsi konfigurasi Cloudinary ada di sini
const { storage } = require('../cloudinaryConfig'); // Konfigurasi storage Cloudinary
const Place = require('../models/Place');
const { userAuthenticate } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage });

// Membuat tempat baru dengan gambar
router.post('/', userAuthenticate, upload.array('images'), async (req, res) => {
    try {
        const { name, category, description, address, lat, lng } = req.body;
        const images = req.files.map(file => ({ url: file.path, public_id: file.filename }));
        const newPlace = new Place({ name, category, description, address, lat, lng, images });
        await newPlace.save();
        res.status(201).json(newPlace);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

// Mendapatkan semua tempat
router.get('/', async (req, res) => {
    try {
        const places = await Place.find({});
        res.json(places);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching places", error: error.toString() });
    }
});

// Mendapatkan satu tempat berdasarkan id
router.get('/:id', async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) return res.status(404).json({ message: 'Tempat tidak ditemukan' });
        res.json(place);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching place", error: error.toString() });
    }
});

// Memperbarui tempat, termasuk gambar
router.patch('/:id', userAuthenticate, upload.array('images'), async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) return res.status(404).json({ message: 'Tempat tidak ditemukan' });

        // Update informasi tempat
        Object.keys(req.body).forEach(key => {
            if (key !== 'images') place[key] = req.body[key];
        });

        // Tambahkan gambar baru
        if (req.files) {
            const newImages = req.files.map(file => ({ url: file.path, public_id: file.filename }));
            place.images.push(...newImages);
        }

        await place.save();
        res.json(place);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal memperbarui tempat", error: error.toString() });
    }
});

// Like atau unlike tempat
router.patch('/:placeId/like', userAuthenticate, async (req, res) => {
    try {
        const place = await Place.findById(req.params.placeId);
        if (!place) return res.status(404).json({ message: 'Place not found' });

        const index = place.likes.indexOf(req.user._id);
        if (index === -1) {
            place.likes.push(req.user._id);
        } else {
            place.likes.splice(index, 1);
        }

        await place.save();
        res.json({
            status: index === -1 ? 'Liked' : 'Unliked',
            likes: place.likes.length,
            place
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to like the place', error: error.toString() });
    }
});

// Menghapus tempat
router.delete('/:id', userAuthenticate, async (req, res) => {
    try {
        const place = await Place.findByIdAndDelete(req.params.id);
        if (place && place.images.length) {
            // Hapus gambar dari Cloudinary
            place.images.forEach(async image => {
                await cloudinary.uploader.destroy(image.public_id);
            });
        }
        res.json({ message: 'Tempat berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting place", error: error.toString() });
    }
});

module.exports = router;
