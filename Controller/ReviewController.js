const express = require('express');
const Review = require('../models/Review');
const Place = require('../models/Place');
const User = require('../models/User');
const { userAuthenticate } = require('../middleware/auth');

const router = express.Router();


router.get('/place/:placeId', async (req, res) => {
    try {
      
        const reviews = await Review.find({ place: req.params.placeId });     
        if(reviews.length > 0) {
            const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
            res.send({
                reviews,
                averageRating: averageRating.toFixed(2) 
            });
        } else {
            res.send({
                message: "No reviews",
                averageRating: "N/A"
            });
        }
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

        if (!req.body.rating) {
            return res.status(400).send('Rating is required');
        }

        const rating = parseInt(req.body.rating, 10);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            return res.status(400).send('Invalid rating value. Rating must be between 1 and 5.');
        }

        const review = new Review({
            ...req.body, 
            place: req.params.placeId,
            name: user.username ,
            user: req.user._id
        });

        await review.save();
        res.status(201).send(review);
    } catch (error) {
        res.status(400).send(error);
    }
});
router.delete('/place/:placeId/review/:reviewId', userAuthenticate, async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.user._id;

        const review = await Review.findOne({ _id: reviewId, user: userId });

        if (!review) {
            return res.status(404).send({ message: 'Review not found or user not authorized to delete this review' });
        }

        await Review.findByIdAndDelete(reviewId);

        res.send({ message: 'Review successfully deleted' });
    } catch (error) {
        console.error('Error during review deletion:', error);
        res.status(500).send({ message: 'An error occurred while deleting the review', error: error.toString() });
    }
});


module.exports = router;
