
const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
    title: String,
    image: {
        data: Buffer,
        contentType: String
    }
});

const Slider = mongoose.model('Slider', sliderSchema);
module.exports = Slider;
