
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");


dotenv.config();

const app = express();

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");

  app.use(cors({
    origin: ["http://frontend-url.com", "http://another-frontend-url.com"], // Ganti dengan alamat frontend Anda
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
 

  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/categories', require('./routes/categoryRoutes'));
  app.use('/api/places', require('./routes/placeRoutes'));
  app.use('/api/comments', require('./routes/commentRoutes'));
  app.use('/api/events', require('./routes/eventRoutes'));
  app.use('/api/article', require('./routes/articleRoutes'));
  

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

mongoose.connection.on("error", (err) => {
  console.log("Error connecting to MongoDB", err);
});
