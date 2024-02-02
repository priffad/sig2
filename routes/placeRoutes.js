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
    let updates = { ...req.body };

    // Parse field yang mungkin berformat JSON string menjadi objek/array
    if (typeof updates.deletedImages === 'string') {
        updates.deletedImages = JSON.parse(updates.deletedImages);
    }

    try {
        // Temukan tempat berdasarkan ID
        const place = await Place.findById(id);
        if (!place) {
            return res.status(404).json({ message: 'Tempat tidak ditemukan' });
        }

        // Tambahkan URL gambar baru ke array gambar jika ada
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path);
            updates.images = place.images.concat(newImages);
        } else if (!updates.hasOwnProperty('newImages') && !updates.deletedImages) {
            // Jika tidak ada gambar baru dan tidak ada permintaan penghapusan gambar, tetapkan images ke yang sudah ada
            updates.images = place.images;
        }

        // Hapus gambar yang diminta
        if (updates.deletedImages && updates.deletedImages.length > 0) {
            updates.images = updates.images.filter(image => !updates.deletedImages.includes(image));

            // Hapus dari Cloudinary
            for (const publicId of updates.deletedImages) {
                await cloudinary.uploader.destroy(publicId);
            }
        }

        // Perbarui tempat dengan data baru
        const updatedPlace = await Place.findByIdAndUpdate(id, updates, { new: true }).lean();
        res.json(updatedPlace);
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
