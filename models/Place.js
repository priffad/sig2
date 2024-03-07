const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: String,
    address: String,
    images: [{ url: String, public_id: String }], 
    lng: Number,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const Place = mongoose.model('Place', placeSchema);
module.exports = Place;
