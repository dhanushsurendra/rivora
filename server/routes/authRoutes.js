const express = require('express');
const { loginUser, signupUser } = require('../controllers/authController.js');

const router = express.Router();

router.post('/login', loginUser);
router.post('/signup', signupUser); 

// // Google OAuth login
// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// // Google OAuth callback
// router.get(
//   '/google/callback',
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   (_, res) => {
//     // Redirect after successful login
//     res.redirect('/dashboard'); // or send a JWT cookie if SPA
//   }
// );


module.exports = router;