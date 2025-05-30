const express = require('express')
const {
  loginUser,
  signupUser,
  logoutUser,
  googleLogin
} = require('../controllers/authController.js')

const passport = require('passport')

const router = express.Router()

router.post('/login', loginUser)
router.post('/signup', signupUser)
router.post('/logout', logoutUser)
router.post('/google', googleLogin)

module.exports = router
