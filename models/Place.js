const mongoose = require('mongoose');


const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    public_id: {
        type: String,
        required: true
    }
});


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
    description: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    images: [imageSchema], // Menggunakan array dari schema gambar
    lat: {
        type: Number,
        required: false
    },
    lng: {
        type: Number,
        required: false
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const Place = mongoose.model('Place', placeSchema);

module.exports = Place;
