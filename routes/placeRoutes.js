const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Place = require('../models/Place');
const { userAuthenticate } = require('../middleware/auth');

// Konfigurasi Cloudinary
cloudinary.config({
    cloud_name: 'dijf4rpwv',
    api_key: '325353924959639',
    api_secret: 'nodzRD2PwgBkBzSN-80og4h4eKo',
});

// Konfigurasi penyimpanan Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'places',
        allowedFormats: ['jpg', 'png', 'jpeg'],
    },
});

const upload = multer({ storage: storage });

router.post('/', userAuthenticate, upload.array('images', 4), async (req, res) => {
    try {
        const place = new Place({
            ...req.body,
            images: req.files.map(file => ({
                url: file.path,
                public_id: file.filename
            }))
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
router.get('/top-liked-places', async (req, res) => {
    try {
        const topLikedPlaces = await Place.find()
            .sort({ likes: -1 })
            .limit(5); // Get the top 5 liked places
        res.send(topLikedPlaces);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error fetching top liked places", error: error.message });
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


// Route to get places liked by a specific user
router.get('/liked-by/:userId', userAuthenticate, async (req, res) => {
    try {
        // Check if the requested user ID matches the authenticated user's ID
        if (req.params.userId !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied. You can only view your own liked places." });
        }

        const likedPlaces = await Place.find({ likes: req.params.userId });
        res.send(likedPlaces);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error fetching places liked by the user", error: error.message });
    }
});
// Memperbarui tempat dengan logika untuk menghapus gambar lama dan menambah gambar baru
router.patch('/:id', userAuthenticate, upload.array('newImages'), async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        // Proses gambar baru yang di-upload
        const newImages = req.files.map(file => ({
            url: file.path,
            public_id: file.filename
        }));

        // Gabungkan gambar baru dengan yang lama
        place.images = [...place.images, ...newImages];

        // Cek apakah ada gambar yang perlu dihapus
        if (req.body.deletedImages) {
            const deletedImages = JSON.parse(req.body.deletedImages);
            // Hapus gambar dari Cloudinary
            for (const publicId of deletedImages) {
                await cloudinary.uploader.destroy(publicId);
            }
            // Hapus gambar dari array images di dokumen MongoDB
            place.images = place.images.filter(image => !deletedImages.includes(image.public_id));
        }

        // Update properti lain dari place sesuai dengan data yang diberikan
        if (req.body.name) place.name = req.body.name;
        if (req.body.description) place.description = req.body.description;
        if (req.body.category) place.category = req.body.category;
        if (req.body.address) place.address = req.body.address;
        if (req.body.lat) place.lat = req.body.lat;
        if (req.body.lng) place.lng = req.body.lng;
        // Lanjutkan untuk properti lainnya sesuai kebutuhan

        await place.save();
        res.json(place);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating place", error: error.toString() });
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
