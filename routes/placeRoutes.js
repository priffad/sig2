
const { userAuthenticate } = require('../middleware/auth');


const express = require('express');
const multer = require('multer');
const Place = require('../models/Place');  // Sesuaikan path sesuai kebutuhan

const router = express.Router();
const upload = multer();

// CREATE
router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        const place = new Place({
            name: req.body.name,
            category: req.body.category,
            description: req.body.description,
            address: req.body.address,
            lat: req.body.lat,
            lng: req.body.lng,
            image: {
                data: req.file.buffer,
                contentType: req.file.mimetype
            }
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
       // Di endpoint untuk mendapatkan semua places
const places = await Place.find();
const placesTransformed = places.map(place => {
    return {
        ...place._doc,
        image: {
            data: place.image.data.toString('base64'),
            contentType: place.image.contentType
        }
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
            res.status(404).send('Place not found');
        } else {
            res.send(place);
        }
    } catch (error) {
        res.status(500).send(error);
    }
});
router.get('/:id/image', async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);

        if (!place || !place.image.data) {
            throw new Error();
        }

        res.set('Content-Type', place.image.contentType);
        res.send(place.image.data.toString('base64'));
    } catch (e) {
        res.status(404).send();
    }
});

// UPDATE

router.patch('/:id',userAuthenticate, upload.single('image'), async (req, res) => {
  // Field yang diperbolehkan untuk di-update
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
      
      if (req.file) {
          place.image.data = req.file.buffer;
          place.image.contentType = req.file.mimetype;
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

module.exports = router;
