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

    // Ensure updates.images is an array if not already
    if (updates.images && typeof updates.images === 'string') {
        updates.images = JSON.parse(updates.images);
    } else if (!updates.images) {
        updates.images = [];
    }

    try {
        const place = await Place.findById(id);
        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        // Handle new images (if any)
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({ url: file.path, public_id: file.filename }));
            updates.images = updates.images.concat(newImages);
        }

        // Handle deleted images
        if (updates.deletedImages && updates.deletedImages.length > 0) {
            // Log for debugging
            console.log('Deleting images:', updates.deletedImages);

            // Filter out deleted images from the place's images
            updates.images = updates.images.filter(image => !updates.deletedImages.includes(image.public_id));

            // Delete images from Cloudinary
            for (const publicId of updates.deletedImages) {
                await cloudinary.uploader.destroy(publicId, function(error,result) {
                  console.log(result, error) });
            }
        }

        // Remove deletedImages field from updates to prevent database errors
        delete updates.deletedImages;

        // Update the place with new data
        Object.assign(place, updates);
        await place.save();

        res.json(place);
    } catch (error) {
        console.error('Error updating place:', error);
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
