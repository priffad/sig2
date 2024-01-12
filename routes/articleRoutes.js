const express = require('express');
const multer = require('multer');
const Article = require('../models/Article');
const router = express.Router();
const upload = multer();

const { userAuthenticate } = require('../middleware/auth');

// Convert image data to base64 format
const convertImageToBase64 = (article) => {
    if (article.image && article.image.data) {
        article.image = {
            ...article.image,
            data: article.image.data.toString('base64')
        };
    }
};

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
        convertImageToBase64(article);
        res.status(201).send(article);
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
        const transformedArticle = {
            ...article._doc,
            image: {
                data: article.image.data.toString('base64'),
                contentType: article.image.contentType
            }
        };
        res.status(200).send(transformedArticle);
    } catch (error) {
        res.status(500).send(error);
    }
});


router.patch('/:id', userAuthenticate, upload.single('image'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).send({ message: 'Event not found' });
        }

        const updates = Object.keys(req.body);
        updates.forEach(update => event[update] = req.body[update]);


        if (req.file) {
            event.image = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        await event.save();
        res.status(200).send(event);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/titles', async (req, res) => {
    try {
        const titles = await Article.find({}, 'title');
        res.status(200).send(titles);
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

        // Update article fields
        const updates = Object.keys(req.body);
        updates.forEach(update => article[update] = req.body[update]);

        // Replace the existing image if a new one is provided
        if (req.file) {
            article.image = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        await article.save();
        convertImageToBase64(article);
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
        convertImageToBase64(article);
        res.status(200).send(article);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
