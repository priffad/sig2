const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    description: String,
    address: String,
    images: [String], // URL gambar
    lat: Number,
    lng: Number,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

});

const Place = mongoose.model('Place', placeSchema);
module.exports = Place;
