
const { userAuthenticate } = require('../middleware/auth');


const express = require('express');
const multer = require('multer');
const Place = require('../models/Place');  // Sesuaikan path sesuai kebutuhan

const router = express.Router();
// Konfigurasi Multer untuk menyimpan file di memori
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function deleteImage(imagePath) {
    try {
        fs.unlinkSync(path.join(__dirname, '..', imagePath)); // Sesuaikan path sesuai struktur proyek Anda
    } catch (error) {
        console.error(`Error during file deletion: ${error.message}`);
    }
}

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

router.get('/top-liked', async (req, res) => {
    try {
        const topLikedPlaces = await Place.find()
            .sort({ likes: -1 }) 
            .limit(5);           

        const transformedPlaces = topLikedPlaces.map(place => {
            const imagesTransformed = place.images.map(image => ({
                data: image.data.toString('base64'),
                contentType: image.contentType
            }));
            
            return {
                ...place._doc,
                images: imagesTransformed
            };
        });

        res.send(transformedPlaces);
    } catch (error) {
        res.status(500).send(error);
    }
});
router.get('/my-liked-places', userAuthenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const likedPlaces = await Place.find({ likes: userId });

        const transformedPlaces = likedPlaces.map(place => {
            return {
                ...place._doc,
                images: place.images.map(image => ({
                    data: image.data.toString('base64'),
                    contentType: image.contentType
                }))
            };
        });

        res.send(transformedPlaces);
    } catch (error) {
        res.status(500).send(error);
    }
});

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

// router.patch('/:id', userAuthenticate, upload.array('image', 4), async (req, res) => {
//     const allowedUpdates = ['name', 'category', 'description', 'address', 'lat', 'lng'];
//     const updates = Object.keys(req.body);
    
//     const isValidOperation = updates.every(update => allowedUpdates.includes(update));
//     if (!isValidOperation) {
//         return res.status(400).send({ error: 'Invalid updates!' });
//     }

//     try {
//         const place = await Place.findById(req.params.id);
//         if (!place) {
//             return res.status(404).send('Place not found');
//         }

//         updates.forEach(update => {
//             place[update] = req.body[update];
//         });

//         if (req.files) {
//             const placeImages = req.files.map(file => ({
//                 data: file.buffer,
//                 contentType: file.mimetype
//             }));
//             place.images = place.images.concat(placeImages);
//         }

//         await place.save();
//         res.send(place);
//     } catch (error) {
//         res.status(500).send(error);
//     }
// });
// Route untuk mengedit data tempat, termasuk mengganti gambar
router.put('/:id', userAuthenticate, upload.array('image', 4), async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);

        if (!place) {
            return res.status(404).send('Place not found');
        }

        // Update data tempat
        place.name = req.body.name || place.name;
        place.category = req.body.category || place.category;
        place.description = req.body.description || place.description;
        place.address = req.body.address || place.address;
        place.lat = req.body.lat || place.lat;
        place.lng = req.body.lng || place.lng;

        // Ganti gambar tertentu
        if (req.files && req.files.length > 0 && req.body.imageIndexes) {
            const imageIndexes = req.body.imageIndexes.split(',').map(index => parseInt(index.trim()));
            
            imageIndexes.forEach((index, i) => {
                if (index >= 0 && index < place.images.length && i < req.files.length) {
                    place.images[index] = {
                        data: req.files[i].buffer,
                        contentType: req.files[i].mimetype
                    };
                }
            });
        }

        await place.save();
        res.send(place);
    } catch (error) {
        res.status(500).send(error);
    }
});



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

        // Transform images to base64 format
        const imagesTransformed = place.images.map(image => ({
            data: image.data.toString('base64'),
            contentType: image.contentType
        }));

        res.status(200).json({ 
            status: index === -1 ? 'liked' : 'unliked', 
            likes: place.likes.length, 
            place: {
                ...place._doc,
                images: imagesTransformed
            } 
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to like the place', error: error.message });
    }
});









module.exports = router;
