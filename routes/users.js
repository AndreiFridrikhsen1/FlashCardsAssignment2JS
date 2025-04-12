var express = require('express');
var router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');

// Auth
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/auth/login');
}

// Profile page
router.get('/profile', isAuthenticated, (req, res) => {
  res.render('users/profile', {
    title: 'My Profile',
    user: req.user
  });
});

// Update profile form
router.get('/update-profile', isAuthenticated, (req, res) => {
  res.render('users/update-profile', {
    title: 'Update Profile',
    user: req.user
  });
});

// Update profile
router.post('/update-profile', isAuthenticated, async (req, res) => {
  try {
    const { username, email } = req.body;
    const errors = [];
    
    // Check if username exists
    if (username !== req.user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        errors.push({ msg: 'Username already taken' });
      }
    }
    
    // Check if email exists
    if (email !== req.user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        errors.push({ msg: 'Email already registered' });
      }
    }
    
    if (errors.length > 0) {
      return res.render('users/update-profile', {
        title: 'Update Profile',
        user: req.user,
        errors
      });
    }
    
    // Update user
    await User.findByIdAndUpdate(req.user.id, {
      username,
      email
    });
    
    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/users/profile');
  } catch (err) {
    console.error(err);
    res.render('error', { error: err });
  }
});

module.exports = router;
