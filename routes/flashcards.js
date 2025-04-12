const express = require('express');
const router = express.Router();
const Flashcard = require('../models/flashcard');
const upload = require('../config/multer');
const fs = require('fs');
const path = require('path');

//redir to login if not authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/auth/login');
}

// Show all flashcards
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ user: req.user._id })
                                     .sort({ created: -1 });
    res.render('flashcards/index', { 
      title: 'My Flashcards',
      flashcards: flashcards
    });
  } catch (err) {
    console.error(err);
    res.render('error', { error: err });
  }
});
//show single card
router.get('/show/:id', isAuthenticated, async (req, res) => {
    try {
      const flashcard = await Flashcard.findById(req.params.id);
      
      if (!flashcard || flashcard.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Flashcard not found or unauthorized');
        return res.redirect('/flashcards');
      }
      
      res.render('flashcards/show', {
        title: 'View Flashcard',
        flashcard: flashcard
      });
    } catch (err) {
      console.error(err);
      res.render('error', { error: err });
    }
  });

// Create flashcard
router.get('/create', isAuthenticated, (req, res) => {
  res.render('flashcards/create', { title: 'Create Flashcard' });
});

router.post('/create', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { front, back, category } = req.body;
    
    //input validation
    const errors = [];
    if (!front || !back) {
      errors.push({ msg: 'Please fill out required fields' });
    }
    
    if (errors.length > 0) {
      return res.render('flashcards/create', {
        title: 'Create Flashcard',
        errors,
        front,
        back,
        category
      });
    }
    
    // Create new flashcard
    const newFlashcard = new Flashcard({
      front,
      back,
      category: category || 'General',
      user: req.user._id,
      imagePath: req.file ? `/uploads/${req.file.filename}` : null
    });
    
    await newFlashcard.save();
    req.flash('success_msg', 'Flashcard created successfully');
    res.redirect('/flashcards');
  } catch (err) {
    console.error(err);
    res.render('error', { error: err });
  }
});

// Edit flashcard
router.get('/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);
    
    // Check if flashcard exists and belongs to user
    if (!flashcard || flashcard.user.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Flashcard not found or unauthorized');
      return res.redirect('/flashcards');
    }
    
    res.render('flashcards/edit', {
      title: 'Edit Flashcard',
      flashcard: flashcard
    });
  } catch (err) {
    console.error(err);
    res.render('error', { error: err });
  }
});

router.post('/edit/:id', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { front, back, category } = req.body;
    const flashcard = await Flashcard.findById(req.params.id);
    
    if (!flashcard || flashcard.user.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Flashcard not found or unauthorized');
      return res.redirect('/flashcards');
    }
    
    flashcard.front = front;
    flashcard.back = back;
    flashcard.category = category || 'General';
    
    //image update
    if (req.file) {
      // Delete old image if it exists
      if (flashcard.imagePath) {
        const oldImagePath = path.join(__dirname, '../public', flashcard.imagePath);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      flashcard.imagePath = `/uploads/${req.file.filename}`;
    }
    
    await flashcard.save();
    req.flash('success_msg', 'Flashcard updated successfully');
    res.redirect('/flashcards');
  } catch (err) {
    console.error(err);
    res.render('error', { error: err });
  }
});

// confirm delete
router.get('/delete/:id', isAuthenticated, async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);
    
    if (!flashcard || flashcard.user.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Flashcard not found or unauthorized');
      return res.redirect('/flashcards');
    }
    
    res.render('flashcards/delete', {
      title: 'Delete Flashcard',
      flashcard: flashcard
    });
  } catch (err) {
    console.error(err);
    res.render('error', { error: err });
  }
});

// Delete flashcard
router.post('/delete/:id', isAuthenticated, async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);
    if (!flashcard || flashcard.user.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Flashcard not found or unauthorized');
      return res.redirect('/flashcards');
    }
    
    // Delete image if exists
    if (flashcard.imagePath) {
      const imagePath = path.join(__dirname, '../public', flashcard.imagePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete flashcard
    await Flashcard.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Flashcard deleted successfully');
    res.redirect('/flashcards');
  } catch (err) {
    console.error(err);
    res.render('error', { error: err });
  }
});


//Study flashcards

router.get('/study', isAuthenticated, async (req, res) => {
    try {
      const flashcards = await Flashcard.find({ user: req.user._id });
      
      const flashcardsData = flashcards.map(card => ({
        _id: card._id.toString(),
        front: card.front,
        back: card.back,
        category: card.category,
        imagePath: card.imagePath
      }));
      
      res.render('flashcards/study', {
        title: 'Study Flashcards',
        flashcards: flashcards,
        flashcardsJSON: JSON.stringify(flashcardsData)
      });
    } catch (err) {
      console.error(err);
      res.render('error', { error: err });
    }
  });

module.exports = router;