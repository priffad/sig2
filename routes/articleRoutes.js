// routes/articleRoutes.js

const express = require('express');
const multer = require('multer');
const Article = require('../models/Article');
const { userAuthenticate } = require('../middleware/auth');
const { uploadImageToS3 } = require('../services/s3Service'); // Sesuaikan dengan lokasi file Anda

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        let imageUrl = null;
        if (req.file) {
            imageUrl = await uploadImageToS3(req.file.buffer, req.file.mimetype);
        }

        const article = new Article({
            ...req.body,
            imageUrl: imageUrl
        });

        await article.save();
        res.status(201).send(article);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/', async (req, res) => {
    try {
        const articles = await Article.find();
        res.status(200).send(articles);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).send({ message: 'Article not found' });
        }
        res.status(200).send(article);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/:id', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).send({ message: 'Article not found' });
        }

        const updates = Object.keys(req.body);
        updates.forEach(update => article[update] = req.body[update]);

        if (req.file) {
            const newImageUrl = await uploadImageToS3(req.file.buffer, req.file.mimetype);
            article.imageUrl = newImageUrl;
        }

        await article.save();
        res.status(200).send(article);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/:id', userAuthenticate, async (req, res) => {
    try {
        const article = await Article.findByIdAndDelete(req.params.id);
        if (!article) {
            return res.status(404).send({ message: 'Article not found' });
        }
        res.status(200).send({ message: 'Article deleted' });
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
