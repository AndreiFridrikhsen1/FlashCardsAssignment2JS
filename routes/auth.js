const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

// Registration page
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, password2 } = req.body;
    const errors = [];
    
    // Validation
    if (!username || !email || !password || !password2) {
      errors.push({ msg: 'Please fill in all fields' });
    }
    
    if (password !== password2) {
      errors.push({ msg: 'Passwords do not match' });
    }
    
    if (password.length < 6) {
      errors.push({ msg: 'Password should be at least 6 characters' });
    }
    
    if (errors.length > 0) {
      res.render('register', {
        title: 'Register',
        errors,
        username,
        email
      });
    } else {
      // Check if the user exists
      const userExists = await User.findOne({ $or: [{ email }, { username }] });
      
      if (userExists) {
        errors.push({ msg: 'Email or username is already registered' });
        res.render('register', {
          title: 'Register',
          errors,
          username,
          email
        });
      } else {
        // Create new user
        const newUser = new User({
          username,
          email,
          password
        });
        
        await newUser.save();
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/auth/login');
      }
    }
  } catch (err) {
    console.error(err);
    res.render('error', { error: err });
  }
});

// Login page
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/flashcards',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
});

// GitHub auth
router.get('/github', passport.authenticate('github'));
router.get('/github/callback', 
  passport.authenticate('github', { 
    failureRedirect: '/auth/login',
    failureFlash: true 
  }),
  (req, res) => {
    res.redirect('/flashcards');
  }
);

// Logout
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/auth/login');
  });
});

module.exports = router;