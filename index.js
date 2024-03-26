const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
// const Grid = require('gridfs-stream');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// let gfs;
// const conn = mongoose.connection;
// conn.once('open', () => {
//   gfs = Grid(conn.db, mongoose.mongo);
//   gfs.collection('uploads');
//   console.log("Connected to MongoDB");
// });


const userRoutes = require('./Controller/UserController');
const adminRoutes = require('./Controller/AdminController');
const categoryRoutes = require('./Controller/CategoryController');
const placeRoutes = require('./Controller/PlaceController');
const reviewRoutes = require('./Controller/ReviewController');
const articleRoutes = require('./Controller/ArticleController');
const eventRoutes = require('./Controller/EventController');
const sliderRoutes = require('./Controller/SliderController');

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/sliders', sliderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
