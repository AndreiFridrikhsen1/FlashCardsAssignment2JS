// routes/index.js
var express = require('express');
var router = express.Router();
const Flashcard = require('../models/flashcard');

//home page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'FlashCard App' });
});



// About page
router.get('/about', function(req, res, next) {
  res.render('about', { title: 'About FlashCard App' });
});

module.exports = router;

