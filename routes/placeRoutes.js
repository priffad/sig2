const express = require('express');
const Place = require('../models/Place');
const router = express.Router();
const Comment = require('../models/Comment');
const authMiddleware = require('../middleware/authMiddleware');

const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Get all places
router.get('/', async (req, res) => {
    const places = await Place.find().populate('category');
    res.send(places);
});

// Create a new place (Admin only)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  const { name, category, description, lat, lng } = req.body;
  const image = req.file.path;

  let place = new Place({
      name,
      category,
      description,
      image,
      lat,
      lng
  });

    try {
        place = await place.save();
        res.send(place);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Update a place (Admin only)
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  const { name, category, description, lat, lng } = req.body;
  const image = req.file ? req.file.path : undefined;

  const updateObject = { name, category, description, lat, lng };
  if (image) {
      updateObject.image = image;
  }

  const place = await Place.findByIdAndUpdate(req.params.id, updateObject, { new: true });

    if (!place) return res.status(404).send('The place with the given ID was not found.');

    res.send(place);
});

// Delete a place (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    const place = await Place.findByIdAndRemove(req.params.id);

    if (!place) return res.status(404).send('The place with the given ID was not found.');

    res.send(place);
});


// Endpoint untuk mencari tempat dengan jumlah komentar terbanyak
router.get('/places-with-most-comments', async (req, res) => {
  try {
    const placesWithMostComments = await Comment.aggregate([
      {
        $group: {
          _id: '$place', // Mengelompokkan komentar berdasarkan tempat
          totalComments: { $sum: 1 } // Menghitung jumlah komentar
        }
      },
      {
        $sort: { totalComments: -1 } // Mengurutkan berdasarkan jumlah komentar secara turun
      }
    ]);

    const topPlaceId = placesWithMostComments[0]._id; // Mengambil ID tempat dengan komentar terbanyak

    // Mengambil data tempat dengan ID yang memiliki komentar terbanyak
    const topPlace = await Place.findById(topPlaceId);

    res.json(topPlace);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Endpoint untuk mencari 5 tempat dengan jumlah komentar terbanyak
router.get('/top-5-places-with-most-comments', async (req, res) => {
    try {
      const placesWithMostComments = await Comment.aggregate([
        {
          $group: {
            _id: '$place', // Mengelompokkan komentar berdasarkan tempat
            totalComments: { $sum: 1 } // Menghitung jumlah komentar
          }
        },
        {
          $sort: { totalComments: -1 } // Mengurutkan berdasarkan jumlah komentar secara turun
        },
        {
          $limit: 5 // Mengambil 5 hasil teratas
        }
      ]);
  
      const topPlaceIds = placesWithMostComments.map(item => item._id); // Mengambil ID tempat dari hasil agregasi
  
      // Mengambil data tempat dengan ID yang memiliki komentar terbanyak
      const topPlaces = await Place.find({ _id: { $in: topPlaceIds } });
  
      res.json(topPlaces);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
// Endpoint untuk mendapatkan tempat dengan urutan terbanyak
router.get('/places-with-most-comments/:limit', async (req, res) => {
    const limit = parseInt(req.params.limit);
  
    try {
      const placesWithMostComments = await Comment.aggregate([
        {
          $group: {
            _id: '$place', // Mengelompokkan komentar berdasarkan tempat
            totalComments: { $sum: 1 } // Menghitung jumlah komentar
          }
        },
        {
          $sort: { totalComments: -1 } // Mengurutkan berdasarkan jumlah komentar secara turun
        },
        {
          $limit: limit // Mengambil hasil sesuai dengan limit yang ditentukan
        }
      ]);
  
      const topPlaceIds = placesWithMostComments.map(item => item._id); // Mengambil ID tempat dari hasil agregasi
  
      // Mengambil data tempat dengan ID yang memiliki komentar terbanyak
      const topPlaces = await Place.find({ _id: { $in: topPlaceIds } });
  
      res.json(topPlaces);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
    
module.exports = router;





