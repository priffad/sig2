const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type :String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    imageUrl: String,
    bookmarkedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const Article = mongoose.model('Article', articleSchema);
module.exports = Article;
