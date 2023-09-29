const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const multer = require('multer');
const AWS = require("aws-sdk");
const Place = require('../models/Place');
const Comment = require('../models/Comment');
const authMiddleware = require('../middleware/authMiddleware');


AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: 'us-west-2' // Anda mungkin perlu mengubah ini sesuai dengan region S3 bucket Anda
});



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// AWS S3 Routes
router.get('/s3/*', async (req, res) => {
    let filename = req.path.slice(4); 

    try {
        let s3File = await s3.getObject({
            Bucket: process.env.BUCKET,
            Key: filename,
        }).promise();

        res.set('Content-type', s3File.ContentType);
        res.send(s3File.Body);

    } catch (error) {
        if (error.code === 'NoSuchKey') {
            console.log(`No such key ${filename}`);
            res.sendStatus(404).end();
        } else {
            console.log(error);
            res.sendStatus(500).end();
        }
    }
});

router.put('/s3/*', async (req, res) => {
    let filename = req.path.slice(4);

    await s3.putObject({
        Body: JSON.stringify(req.body),
        Bucket: process.env.BUCKET,
        Key: filename,
    }).promise();

    res.set('Content-type', 'text/plain');
    res.send('ok').end();
});

router.delete('/s3/*', async (req, res) => {
    let filename = req.path.slice(4);

    await s3.deleteObject({
        Bucket: process.env.BUCKET,
        Key: filename,
    }).promise();

    res.set('Content-type', 'text/plain');
    res.send('ok').end();
});

// Places Routes
const s3 = new AWS.S3();

router.get('/', async (req, res) => {
    const places = await Place.find().populate('category');
    for (let place of places) {
        const key = place.image.split('/').pop();
        place.image = s3.getSignedUrl('getObject', {
            Bucket: process.env.CYCLIC_BUCKET_NAME,
            Key: key,
            Expires: 3600 // durasi validitas URL (1 jam dalam detik)
        });
    }
    res.send(places);
});

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    const { name, category, description, lat, lng } = req.body;
    const imageFile = req.file;

    const s3Params = {
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Key: Date.now() + '-' + imageFile.originalname,
        Body: imageFile.buffer,
        ContentType: imageFile.mimetype
    };

    let imageURL;
    try {
        const s3Response = await s3.upload(s3Params).promise();
        imageURL = s3Response.Location;
    } catch (s3Error) {
        return res.status(500).send(s3Error.message);
    }

    let place = new Place({
        name,
        category,
        description,
        image: imageURL,
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

router.delete('/places/:id', authMiddleware, async (req, res) => {
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





