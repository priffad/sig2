const express = require('express');
const router = express.Router();
const multer = require('multer');
const { cloudinary, getCloudinaryStorage } = require('../cloudinaryConfig'); // Asumsi ini mengarah ke file konfigurasi Cloudinary Anda
const Place = require('../models/Place');
const { userAuthenticate } = require('../middleware/auth');

// Setup multer untuk menggunakan storage Cloudinary
const upload = multer({ storage: getCloudinaryStorage('places') });

// Membuat tempat baru
router.post('/', userAuthenticate, upload.array('image', 4), async (req, res) => {
    try {
        const placeImages = req.files.map(file => ({ url: file.path, public_id: file.filename })); // Simpan URL dan public_id

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
router.patch('/:id', userAuthenticate, upload.array('image', 4), async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) {
            return res.status(404).send({ message: 'Tempat tidak ditemukan' });
        }

        // Proses gambar baru dari upload (jika ada)
        const newImagesUrls = req.files.map(file => ({ url: file.path, public_id: file.filename }));

        // Proses gambar yang dipilih untuk dihapus (berdasarkan public_id)
        const imagesToDelete = req.body.imagesToDelete ? JSON.parse(req.body.imagesToDelete) : [];

        // Filter gambar yang tidak dihapus
        const filteredImages = place.images.filter(image => !imagesToDelete.includes(image.public_id));

        // Hapus gambar dari Cloudinary berdasarkan public_id
        for (const public_id of imagesToDelete) {
            await cloudinary.uploader.destroy(public_id);
        }

        // Update tempat dengan gambar baru dan tanpa gambar yang dihapus
        place.images = [...filteredImages, ...newImagesUrls];
        await place.save();

        res.send(place);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Gagal memperbarui tempat', error: error.toString() });
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
