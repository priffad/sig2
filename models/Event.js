const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    date: Date,
    imageUrl: String // Menyimpan URL gambar dari S3
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
