const express = require('express');
const multer = require('multer');
const { userAuthenticate } = require('../middleware/auth');
const Place = require('../models/Place');
const { getCloudinaryStorage, cloudinary } = require('../cloudinaryConfig');

// Setup multer untuk menggunakan cloudinary storage untuk 'places'
const storage = getCloudinaryStorage('places');
const upload = multer({ storage });

const router = express.Router();

// Membuat tempat baru dengan gambar
router.post('/', userAuthenticate, upload.array('images', 4), async (req, res) => {
    try {
        const placeImages = req.files.map(file => ({ url: file.path, filename: file.filename }));
        const place = new Place({ ...req.body, images: placeImages });
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
        res.status(200).json(places);
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
        res.status(200).json(place);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching place", error: error.toString() });
    }
});

// Memperbarui tempat
router.patch('/:id', userAuthenticate, upload.array('newImages', 4), async (req, res) => {
    try {
        const { id } = req.params;
        let place = await Place.findById(id);

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        if (req.files) {
            const newImages = req.files.map(file => ({ url: file.path, filename: file.filename }));
            place.images.push(...newImages);
        }

        // Update fields if provided
                // Update fields if provided
                place.name = req.body.name || place.name;
                place.description = req.body.description || place.description;
                place.address = req.body.address || place.address;
                place.lat = req.body.lat || place.lat;
                place.lng = req.body.lng || place.lng;
                // Anda bisa menambahkan atau memperbarui field lain sesuai kebutuhan
                
                // Simpan perubahan
                await place.save();
        
                res.status(200).json(place);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Error updating place", error: error.toString() });
            }
        });
        
        // Menghapus tempat
        router.delete('/:id', userAuthenticate, async (req, res) => {
            try {
                const place = await Place.findByIdAndDelete(req.params.id);
                if (!place) {
                    return res.status(404).json({ message: 'Place not found' });
                }
        
                // Jika tempat memiliki gambar, hapus gambar tersebut dari Cloudinary
                if (place.images && place.images.length > 0) {
                    for (let image of place.images) {
                        await cloudinary.uploader.destroy(image.filename);
                    }
                }
        
                res.status(200).json({ message: 'Place deleted successfully' });
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Error deleting place", error: error.toString() });
            }
        });
        
        module.exports = router;
        
