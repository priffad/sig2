const express = require('express');
const Article = require('../models/Article');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all articles
router.get('/', async (req, res) => {
    const articles = await Article.find();
    res.send(articles);
});

// Create a new article (Admin only)
router.post('/', authMiddleware, async (req, res) => {
    const { title, content, author } = req.body;

    let article = new Article({
        title,
        content,
        author
    });

    try {
        article = await article.save();
        res.send(article);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Update an article (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    const { title, content, author } = req.body;
    const article = await Article.findByIdAndUpdate(req.params.id, { title, content, author }, { new: true });

    if (!article) return res.status(404).send('The article with the given ID was not found.');

    res.send(article);
});

module.exports = router;
