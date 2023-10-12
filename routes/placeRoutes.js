
const { userAuthenticate } = require('../middleware/auth');


const express = require('express');
const multer = require('multer');
const Place = require('../models/Place');  // Sesuaikan path sesuai kebutuhan

const router = express.Router();
const upload = multer();

// CREATE

router.post('/', userAuthenticate, upload.array('image', 4), async (req, res) => {
    try {
        const placeImages = req.files.map(file => ({
            data: file.buffer,
            contentType: file.mimetype
        }));
        
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
        res.status(500).send(error);
    }
});


// READ (Semua places)
router.get('/', async (req, res) => {
    try {
        const places = await Place.find();
        const placesTransformed = places.map(place => {
            const imagesTransformed = place.images.map(image => ({
                data: image.data.toString('base64'),
                contentType: image.contentType
            }));
            
            return {
                ...place._doc,
                images: imagesTransformed
            };
        });
        
        res.send(placesTransformed);
    } catch (error) {
        res.status(500).send(error);
    }
});


// READ (Place tunggal berdasarkan ID)
router.get('/:id', async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);

        if (!place) {
            return res.status(404).send('Place not found');
        }

        const transformedPlace = {
            ...place._doc,
            images: place.images.map(image => ({
                data: image.data.toString('base64'),
                contentType: image.contentType
            }))
        };

        res.send(transformedPlace);
    } catch (error) {
        res.status(500).send(error);
    }
});


// UPDATE
router.patch('/:id', userAuthenticate, upload.array('image', 4), async (req, res) => {
    const allowedUpdates = ['name', 'category', 'description', 'address', 'lat', 'lng'];
    const updates = Object.keys(req.body);
    
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const place = await Place.findById(req.params.id);
        
        if (!place) {
            return res.status(404).send('Place not found');
        }

        // Update setiap field yang disertakan dalam request
        updates.forEach(update => place[update] = req.body[update]);

        if (req.files) {
            const placeImages = req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            }));
            
            // Mengganti gambar yang sudah ada dengan yang baru
            place.images = placeImages;
        }

        await place.save();
        
        res.send(place);
    } catch (error) {
        res.status(500).send(error);
    }
});


// DELETE
router.delete('/:id', userAuthenticate, async (req, res) => {
    try {
        const place = await Place.findByIdAndDelete(req.params.id);
        if (!place) {
            res.status(404).send('Place not found');
        } else {
            res.send(place);
        }
    } catch (error) {
        res.status(500).send(error);
    }
});
// Endpoint untuk menyukai sebuah place
router.patch('/:placeId/like', userAuthenticate, async (req, res) => {
    try {
        const place = await Place.findById(req.params.placeId);

        if (!place) {
            return res.status(404).send('Place not found');
        }

        if (!place.likes.includes(req.user._id)) { 
            place.likes.push(req.user._id);
            await place.save();
            res.send(place);
        } else {
            res.status(400).send('You have already liked this place');
        }

    } catch (error) {
        res.status(500).send(error);
    }
});
router.get('/my-liked-places', userAuthenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const likedPlaces = await Place.find({ likes: userId }).select('name'); // Asumsikan Anda hanya ingin nama place
        res.send(likedPlaces);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
