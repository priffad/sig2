const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const Grid = require('gridfs-stream');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let gfs;
const conn = mongoose.connection;
conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
  console.log("Connected to MongoDB");
});

// Import routes
const userRoutes = require('./routes/UserController');
const adminRoutes = require('./routes/AdminController');
const categoryRoutes = require('./routes/CategoryController');
const placeRoutes = require('./routes/PlaceController');
const reviewRoutes = require('./routes/ReviewController');
const articleRoutes = require('./routes/ArticleController');
const eventRoutes = require('./routes/EventController');
const sliderRoutes = require('./routes/SliderController');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/sliders', sliderRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
