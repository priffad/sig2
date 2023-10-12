
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: String,
    date: Date,
    image: {
        data: Buffer,
        contentType: String
    }
});

const Article = mongoose.model('Article', articleSchema);
module.exports = Article;
