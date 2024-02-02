const express = require('express');
const router = express.Router();
const multer = require('multer');
const { cloudinary } = require('../cloudinaryConfig'); // Pastikan ini mengarah ke file konfigurasi Cloudinary Anda
const { getCloudinaryStorage } = require('../cloudinaryConfig');
const Place = require('../models/Place');
const { userAuthenticate } = require('../middleware/auth');

// Setup multer untuk menggunakan storage Cloudinary
const upload = multer({ storage: getCloudinaryStorage('places') });

// Membuat tempat baru
router.post('/', userAuthenticate, upload.array('image', 4), async (req, res) => {
    try {
        const placeImages = req.files.map(file => file.path);

        const place = new Place({
            ...req.body,
            images: placeImages
        });

        await place.save();
        res.status(201).json(place);
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
        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }
        res.json(place);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching place", error: error.toString() });
    }
});

// Memperbarui tempat
router.patch('/:id', userAuthenticate, upload.array('newImages'), async (req, res) => {
    const { id } = req.params;
    let updates = req.body;

    // Convert deletedImages from JSON string to an array if it's a string.
    if (updates.deletedImages && typeof updates.deletedImages === 'string') {
        try {
            updates.deletedImages = JSON.parse(updates.deletedImages);
        } catch (error) {
            return res.status(400).json({ message: "Invalid format for deletedImages", error: error.toString() });
        }
    }

    try {
        const place = await Place.findById(id);
        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        // Add new images to the place's images if there are any
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({ url: file.path, public_id: file.filename }));
            updates.images = (place.images || []).concat(newImages);
        }

        // Delete specified images from Cloudinary and remove them from the place's images
        if (updates.deletedImages && updates.deletedImages.length > 0) {
            // Filter out deleted images
            updates.images = (place.images || []).filter(image => !updates.deletedImages.includes(image.public_id));

            // Delete images from Cloudinary
            for (const publicId of updates.deletedImages) {
                await cloudinary.uploader.destroy(publicId);
            }
        }

        // Update the place with new data
        Object.assign(place, updates);
        await place.save();

        res.json(place);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating place", error: error.toString() });
    }
});
// Menghapus tempat
router.delete('/:id', userAuthenticate, async (req, res) => {
    try {
        const place = await Place.findByIdAndRemove(req.params.id);
        if (place && place.images) {
            // Hapus gambar dari Cloudinary
            for (const image of place.images) {
                const publicId = image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
        }
        res.json({ message: 'Place deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting place", error: error.toString() });
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
