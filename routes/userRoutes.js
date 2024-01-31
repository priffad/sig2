const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const { userAuthenticate } = require('../middleware/auth');
const router = express.Router();


router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  

  let user = await User.findOne({ username });
  if (user) return res.status(400).send({ error: 'Username already exists' });

  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
} catch (error) {
    res.status(400).send(error);
}
});


router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      if (!user) {
          return res.status(400).send({ error: 'Invalid login credentials' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).send({ error: 'Invalid login credentials' });
      }
      const token = jwt.sign({ _id: user._id }, process.env.SECRET_KEY);
  
    
      res.send({ token: token, userId: user._id }); // Mengembalikan token dan userId
    } catch (error) {
      res.status(500).send(error);
    }
  });


router.patch('/user/:userId/bookmarkArticle/:articleId', userAuthenticate, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user.bookmarkedArticles.includes(req.params.articleId)) {
            user.bookmarkedArticles.push(req.params.articleId);
            await user.save();
            res.status(200).send({ message: 'Article bookmarked successfully' });
        } else {
            user.bookmarkedArticles.pull(req.params.articleId);
            await user.save();
            res.status(200).send({ message: 'Article unbookmarked successfully' });
        }
    } catch (error) {
        res.status(500).send(error);
    }
});


router.patch('/user/:userId/bookmarkEvent/:eventId', userAuthenticate, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user.bookmarkedEvents.includes(req.params.eventId)) {
            user.bookmarkedEvents.push(req.params.eventId);
            await user.save();
            res.status(200).send({ message: 'Event bookmarked successfully' });
        } else {
            user.bookmarkedEvents.pull(req.params.eventId);
            await user.save();
            res.status(200).send({ message: 'Event unbookmarked successfully' });
        }
    } catch (error) {
        res.status(500).send(error);
    }
});


router.get('/user/:userId/bookmarkedArticles', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('bookmarkedArticles');
        const transformedArticles = user.bookmarkedArticles.map(article => ({
            ...article._doc,
            image: article.image ? {
                data: article.image.data.toString('base64'),
                contentType: article.image.contentType
            } : null
        }));
        res.status(200).send(transformedArticles);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/user/:userId/bookmarkedEvents', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('bookmarkedEvents');
        const transformedEvents = user.bookmarkedEvents.map(event => ({
            ...event._doc,
            image: event.image ? {
                data: event.image.data.toString('base64'),
                contentType: event.image.contentType
            } : null
        }));
        res.status(200).send(transformedEvents);
    } catch (error) {
        res.status(500).send(error);
    }
});


module.exports = router;
