// models/Article.js

const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: String,
    date: {
        type: Date,
        default: Date.now
    },
    imageUrl: String // Menyimpan URL gambar dari S3
});

const Article = mongoose.model('Article', articleSchema);
module.exports = Article;
