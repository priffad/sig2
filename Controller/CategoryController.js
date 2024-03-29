
const { userAuthenticate } = require('../middleware/auth');

const express = require('express');
const Category = require('../models/Category');
const Place = require('../models/Place');
const router = express.Router();

router.post('/', userAuthenticate, async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).send(category);
    } catch (error) {
        res.status(400).send(error);
    }
});
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find();
        res.send(categories);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/:categoryId/places', async (req, res) => {
    try {
        const category = await Category.findById(req.params.categoryId);
        if (!category) {
            return res.status(404).json([]); 
        }

        const places = await Place.find({ category: category._id })
                                  .populate('category', 'name') 
                                  .select('name description address images lat lng likes'); 

        res.json(places); 
    } catch (error) {
        console.error('Failed to fetch places by category:', error);
        res.status(500).json([]); 
    }
});


router.put('/:id', userAuthenticate, async (req, res) => {
    const { name } = req.body;
    const category = await Category.findByIdAndUpdate(req.params.id, { name }, { new: true });

    if (!category) return res.status(404).send('The category with the given ID was not found.');

    res.send(category);
});
router.delete('/:id', userAuthenticate, async (req, res) => {
    const category = await Category.findByIdAndRemove(req.params.id);

    if (!category) return res.status(404).send('The category with the given ID was not found.');

    res.send(category);
});

module.exports = router;
