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
    image: {
        data: Buffer,  // Ini akan menyimpan gambar dalam bentuk binary
        contentType: String  // Ini akan menyimpan tipe konten dari gambar (e.g., image/jpeg)
    },
    lat: Number,
    lng: Number,
    likes: [mongoose.Schema.Types.ObjectId],  // Array dari User IDs
});

const Place = mongoose.model('Place', placeSchema);
module.exports = Place;
