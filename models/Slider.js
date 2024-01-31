
const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
    title: String,
    imageUrl: String 
});

const Slider = mongoose.model('Slider', sliderSchema);
module.exports = Slider;
