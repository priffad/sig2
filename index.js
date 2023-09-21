require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');

// const app = express();
// const PORT = process.env.PORT || 3000;
// // Koneksi ke MongoDB
// mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log('Connected to MongoDB'))
//     .catch(error => console.error('Could not connect to MongoDB', error));

// app.use(express.json());
// const authRoutes = require('./routes/commentRoutes');
// const categoryRoutes = require('./routes/articleRoutes');
// const placeRoutes = require('./routes/eventRoutes');
// const commentRoutes = require('./routes/commentRoutes');
// const articleRoutes = require('./routes/articleRoutes');
// const eventRoutes = require('./routes/eventRoutes');

// // ...kode setup Express, Middleware, dll.
// app.use('/api/auth', authRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/places', placeRoutes);
// app.use('/api/comments', commentRoutes);
// app.use('/api/articles', articleRoutes);
// app.use('/api/events', eventRoutes);



// const PORT = 3000;
// app.listen(PORT, () => {
//     console.log(`Server started on http://localhost:${PORT}`);
// });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Use CORS
app.use(cors());

// MongoDB Atlas connection string. You can find this in your MongoDB Atlas dashboard.
// Ensure you replace <USERNAME>, <PASSWORD>, and <DBNAME> with your actual credentials.

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB connected');
})
.catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

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


// Start your server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');

// const app = express();

// // Koneksi ke MongoDB
// mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log('Connected to MongoDB'))
//     .catch(error => console.error('Could not connect to MongoDB', error));

// app.use(express.json());

// // Routes
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/categories', require('./routes/categoryRoutes'));
// app.use('/api/places', require('./routes/placeRoutes'));

// const PORT = 3000;
// app.listen(PORT, () => {
//     console.log(`Server started on http://localhost:${PORT}`);
// });
