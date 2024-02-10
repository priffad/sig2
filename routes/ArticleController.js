// const express = require('express');
// const multer = require('multer');
// const { userAuthenticate } = require('../middleware/auth');
// const Article = require('../models/Article');
// const { getCloudinaryStorage, cloudinary } = require('../cloudinaryConfig');

// // Setup multer untuk menggunakan cloudinary storage
// const storage = getCloudinaryStorage('articles');
// const upload = multer({ storage });

// const router = express.Router();

// // Membuat artikel baru
// router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
//     try {
//         const article = new Article({
//             ...req.body,
//             imageUrl: req.file ? req.file.path : ''
//         });
//         await article.save();
//         res.status(201).json(article);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Internal server error", error: error.toString() });
//     }
// });

// // Mendapatkan semua artikel
// router.get('/', async (req, res) => {
//     try {
//         const articles = await Article.find({});
//         res.status(200).json(articles);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Error fetching articles", error: error.toString() });
//     }
// });

// // Mendapatkan satu artikel berdasarkan id
// router.get('/:id', async (req, res) => {
//     try {
//         const article = await Article.findById(req.params.id);
//         if (!article) {
//             return res.status(404).json({ message: 'Article not found' });
//         }
//         res.status(200).json(article);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Error fetching article", error: error.toString() });
//     }
// });

// // Memperbarui artikel
// router.patch('/:id', userAuthenticate, upload.single('image'), async (req, res) => {
//     const { id } = req.params;

//     const articleUpdates = req.body;
//     if (req.file) {
//         articleUpdates.imageUrl = req.file.path;
//     }

//     try {
//         const updatedArticle = await Article.findByIdAndUpdate(id, articleUpdates, { new: true });
//         res.status(200).json(updatedArticle);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Error updating article", error: error.toString() });
//     }
// });


// // Menghapus artikel
// router.delete('/:id', userAuthenticate, async (req, res) => {
//     try {
//         const article = await Article.findByIdAndRemove(req.params.id);
//         if (article && article.imageUrl) {
//             const publicId = article.imageUrl.split('/').pop().split('.')[0];
//             await cloudinary.uploader.destroy(publicId);
//         }
//         res.status(200).json({ message: 'Article deleted successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Error deleting article", error: error.toString() });
//     }
// });

// module.exports = router;
const express = require('express');
const multer = require('multer');
const Article = require('../models/Article');
const { userAuthenticate } = require('../middleware/auth');
const { getCloudinaryStorage } = require('../cloudinaryConfig');

const router = express.Router();
const storage = getCloudinaryStorage('articles');
const upload = multer({ storage });

// Membuat artikel baru
router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        const article = new Article({
            ...req.body,
            imageUrl: req.file ? req.file.path : '',
        });
        await article.save();
        res.status(201).json(article);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

// Mendapatkan semua artikel
router.get('/', async (req, res) => {
    try {
        const articles = await Article.find({});
        res.status(200).json(articles);
    } catch (error) {
        res.status(500).json({ message: "Error fetching articles", error: error.toString() });
    }
});

// Mendapatkan artikel berdasarkan ID
router.get('/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.status(200).json(article);
    } catch (error) {
        res.status(500).json({ message: "Error fetching article", error: error.toString() });
    }
});

// Update artikel
router.patch('/:id', userAuthenticate, upload.single('image'), async (req, res) => {
    const updates = req.body;
    if (req.file) {
        updates.imageUrl = req.file.path;
    }
    try {
        const article = await Article.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.status(200).json(article);
    } catch (error) {
        res.status(500).json({ message: "Error updating article", error: error.toString() });
    }
});

// Delete artikel
router.delete('/:id', userAuthenticate, async (req, res) => {
    try {
        await Article.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Article deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: "Error deleting article", error: error.toString() });
    }
});

// Mendapatkan artikel yang dibookmark oleh pengguna
router.get('/bookmarkedArticles/:userId', userAuthenticate, async (req, res) => {
    const { userId } = req.params;
    try {
        const articles = await Article.find({ bookmarkedBy: userId });
        res.status(200).json(articles);
    } catch (error) {
        res.status(500).send({ message: 'Internal server error', error: error.message });
    }
});

// Bookmark atau unbookmark artikel
router.patch('/bookmark/:articleId', userAuthenticate, async (req, res) => {
    const { articleId } = req.params;
    const userId = req.user._id; 
    try {
        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).send({ message: 'Article not found' });
        }
        const index = article.bookmarkedBy.indexOf(userId);
        let message = '';
        if (index === -1) {
            article.bookmarkedBy.push(userId);
            message = 'Article added to bookmarks successfully';
        } else {
            article.bookmarkedBy.splice(index, 1);
            message = 'Article removed from bookmarks successfully';
        }
        await article.save();
        res.status(200).send({ message });
    } catch (error) {
        res.status(500).send({ message: 'Failed to update article bookmark', error: error.toString() });
    }
});


module.exports = router;
