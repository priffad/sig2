require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT= process.env.PORT || 3000;
// Koneksi ke MongoDB
const connectDB = async ()=>{
    try {
        const conn = mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log(`Connected to MongoDB : ${(await conn).connection.host}`);
    } catch (error) {
        console.error('Could not connect to MongoDB', error)
        
    }
}

app.use(express.json());
const authRoutes = require('./routes/commentRoutes');
const categoryRoutes = require('./routes/articleRoutes');
const placeRoutes = require('./routes/eventRoutes');
const commentRoutes = require('./routes/commentRoutes');
const articleRoutes = require('./routes/articleRoutes');
const eventRoutes = require('./routes/eventRoutes');

// ...kode setup Express, Middleware, dll.
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/events', eventRoutes);

connectDB().then(
    ()=> {
        app.listen(PORT,()=>
        {
            console.log(`Listening on port ${PORT}`)
        })
    }
)

  