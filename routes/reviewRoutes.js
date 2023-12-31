const express = require('express');
const Review = require('../models/Review');
const Place = require('../models/Place');
const User = require('../models/User');
const { userAuthenticate } = require('../middleware/auth');

const router = express.Router();


router.get('/place/:placeId', async (req, res) => {
    try {
        const reviews = await Review.find({ place: req.params.placeId });
        res.send(reviews);
    } catch (error) {
        res.status(500).send(error);
    }
});


router.post('/place/:placeId', userAuthenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const review = new Review({
            ...req.body,
            place: req.params.placeId,
            name: user.username
        });

        await review.save();
        res.status(201).send(review);
    } catch (error) {
        res.status(400).send(error);
    }
});




module.exports = router;
