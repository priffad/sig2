const express = require('express');
const Comment = require('../models/Comment');
const Place = require('../models/Place');

const router = express.Router();

// Get comments for a specific place
router.get('/:placeId', async (req, res) => {
    const comments = await Comment.find({ place: req.params.placeId });
    res.send(comments);
});

// Create a new comment
router.post('/', async (req, res) => {
    const { name, content, placeId } = req.body;

    const place = await Place.findById(placeId);
    if (!place) return res.status(404).send('Place not found');

    let comment = new Comment({
        name,
        content,
        place: placeId
    });

    try {
        comment = await comment.save();
        res.send(comment);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

module.exports = router;
