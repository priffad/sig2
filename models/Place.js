const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
      } ,
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
      },
      description: String,
      address: String,
      image: String,
      lat: Number,
      lng: Number
    });

const Place = mongoose.model('Place', placeSchema);
module.exports = Place;
