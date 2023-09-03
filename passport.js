const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const mongoose = require('mongoose');
const User = require('./models/User'); // Replace with your User model

passport.use(new FacebookStrategy({
  clientID: '1444287846139099',
  clientSecret: '83496d5f1d77ca5c8d5755694d10f5fd',
  callbackURL: 'http://localhost:3000/auth/facebook/callback',
  profileFields: ['id', 'email', 'displayName'],
},
(accessToken, refreshToken, profile, done) => {
  // Check if the user's email matches an existing user in your database
  User.findOne({ email: profile.emails[0].value }, (err, user) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      // If the user does not exist, you can create a new user in your database
      const newUser = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        // Add other user data as needed
      });
      newUser.save((err) => {
        if (err) {
          return done(err);
        }
        return done(null, newUser);
      });
    } else {
      // If the user already exists, return the user
      return done(null, user);
    }
  });
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

module.exports = passport;
