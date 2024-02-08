const express = require('express');
const multer = require('multer');
const { userAuthenticate } = require('../middleware/auth');
const Article = require('../models/Article');
const { getCloudinaryStorage, cloudinary } = require('../cloudinaryConfig');

// Setup multer untuk menggunakan cloudinary storage
const storage = getCloudinaryStorage('articles');
const upload = multer({ storage });

const router = express.Router();

// Membuat artikel baru
router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        const article = new Article({
            ...req.body,
            imageUrl: req.file ? req.file.path : ''
        });
        await article.save();
        res.status(201).json(article);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

// Mendapatkan semua artikel
router.get('/', async (req, res) => {
    try {
        const articles = await Article.find({});
        res.status(200).json(articles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching articles", error: error.toString() });
    }
});

// Mendapatkan satu artikel berdasarkan id
router.get('/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.status(200).json(article);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching article", error: error.toString() });
    }
});

// Memperbarui artikel
router.patch('/:id', userAuthenticate, upload.single('image'), async (req, res) => {
    const { id } = req.params;

    const articleUpdates = req.body;
    if (req.file) {
        articleUpdates.imageUrl = req.file.path;
    }

    try {
        const updatedArticle = await Article.findByIdAndUpdate(id, articleUpdates, { new: true });
        res.status(200).json(updatedArticle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating article", error: error.toString() });
    }
});


// Menghapus artikel
router.delete('/:id', userAuthenticate, async (req, res) => {
    try {
        const article = await Article.findByIdAndRemove(req.params.id);
        if (article && article.imageUrl) {
            const publicId = article.imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }
        res.status(200).json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting article", error: error.toString() });
    }
});

module.exports = router;
