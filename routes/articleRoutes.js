const { userAuthenticate } = require('../middleware/auth');
const express = require('express');
const multer = require('multer');
const Article = require('../Models/Article');  

const router = express.Router();
const upload = multer();


router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
    const article = new Article({
        ...req.body,
        image: {
            data: req.file.buffer,
            contentType: req.file.mimetype
        }
    });
    try {
        await article.save();
        res.status(201).send(article);
    } catch (error) {
        res.status(500).send(error);
    }
});
// GET all articles
router.get('/', async (req, res) => {
    try {
        const articles = await Article.find();
        res.status(200).send(articles);
    } catch (error) {
        res.status(500).send(error);
    }
});

// GET specific article by ID
router.get('/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).send({ message: 'article not found' });
        }
        res.status(200).send(article);
    } catch (error) {
        res.status(500).send(error);
    }
});
router.get('/titles', async (req, res) => {
    try {
        const titles = await Article.find({}, 'title');  // The second argument specifies which fields to include
        res.status(200).send(titles);
    } catch (error) {
        res.status(500).send(error);
    }
});
// UPDATE article by ID
router.patch('/:id', userAuthenticate, upload.single('image'), async (req, res) => {
    const updates = Object.keys(req.body);
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).send({ message: 'article not found' });
        }
        updates.forEach(update => article[update] = req.body[update]);
        if (req.file) {
            article.image.data = req.file.buffer;
            article.image.contentType = req.file.mimetype;
        }
        await article.save();
        res.status(200).send(article);
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;
// DELETE article by ID
router.delete('/:id', userAuthenticate, async (req, res) => {
    try {
        const article = await Article.findByIdAndDelete(req.params.id);
        if (!article) {
            return res.status(404).send({ message: 'article not found' });
        }
        res.status(200).send(article);
    } catch (error) {
        res.status(500).send(error);
    }
});