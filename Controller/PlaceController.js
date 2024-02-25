const express = require('express');
const router = express.Router();
const multer = require('multer');
const Place = require('../models/Place');
const { userAuthenticate } = require('../middleware/auth');
const { getCloudinaryStorage, cloudinary } = require('../cloudinaryConfig');

const storage = getCloudinaryStorage('places'); 
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
            .limit(5);
        res.send(topLikedPlaces);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error fetching top liked places", error: error.message });
    }
});


router.get('/most-reviewed', async (req, res) => {
    try {
        const mostReviewedPlaces = await Place.aggregate([
            {
                $lookup: {
                    from: "reviews", 
                    localField: "_id", 
                    foreignField: "place", 
                    as: "reviews" 
                }
            },
            {
                $addFields: {
                    numberOfReviews: { $size: "$reviews" } 
                }
            },
            {
                $sort: { numberOfReviews: -1 } 
              
            },
            {
                $limit: 5 
            }
        ]);
        res.json(mostReviewedPlaces);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching most reviewed places", error: error.toString() });
    }
});

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


router.get('/liked-by/:userId', userAuthenticate, async (req, res) => {
    try {
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

router.patch('/:id', userAuthenticate, upload.array('newImages'), async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        const newImages = req.files.map(file => ({
            url: file.path,
            public_id: file.filename
        }));

        place.images = [...place.images, ...newImages];

     
        if (req.body.deletedImages) {
            const deletedImages = JSON.parse(req.body.deletedImages);
     
            for (const publicId of deletedImages) {
                await cloudinary.uploader.destroy(publicId);
            }
            place.images = place.images.filter(image => !deletedImages.includes(image.public_id));
        }

       
        if (req.body.name) place.name = req.body.name;
        if (req.body.description) place.description = req.body.description;
        if (req.body.category) place.category = req.body.category;
        if (req.body.address) place.address = req.body.address;
        if (req.body.lat) place.lat = req.body.lat;
        if (req.body.lng) place.lng = req.body.lng;
    
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
