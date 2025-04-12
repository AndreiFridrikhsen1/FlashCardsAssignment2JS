const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/user');
//login
module.exports = function() {
 
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await User.findOne({ username: username });
        if (!user) {
          return done(null, false, { message: 'Invalid username' });
        }
        
        const isValid = await user.isValidPassword(password);
        if (!isValid) {
          return done(null, false, { message: 'Invalid password' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // gitHub login
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'Ov23lioOWcuvZX4ADVUE',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'c16b47dffec29c9c3895d17a2f8e7595aa2e0d0d',
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'https://flashcardsassignment2js.onrender.com/auth/github/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      user = new User({
        username: profile.username,
        email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
        githubId: profile.id
      });
      
      await user.save();
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};