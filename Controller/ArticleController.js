
const express = require('express');
const multer = require('multer');
const Article = require('../models/Article');
const { userAuthenticate } = require('../middleware/auth');
const { getCloudinaryStorage } = require('../cloudinaryConfig');
const sanitizeHtml = require('sanitize-html');
const router = express.Router();
const storage = getCloudinaryStorage('articles');
const upload = multer({ storage });

// Membuat artikel baru
router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        const cleanContent = sanitizeHtml(req.body.content, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote', 'a']),
            allowedAttributes: {
                'a': ['href', 'name', 'target'],
                'img': ['src']
            },
        });

        const article = new Article({
            title: req.body.title,
            content: cleanContent,
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
    try {
        const cleanContent = sanitizeHtml(req.body.content, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote', 'a']),
            allowedAttributes: {
                'a': ['href', 'name', 'target'],
                'img': ['src']
            },
        });

        const updates = {
            ...req.body,
            content: cleanContent
        };
        if (req.file) {
            updates.imageUrl = req.file.path;
        }

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
