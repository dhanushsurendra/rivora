const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

const User = require('../models/user')

dotenv.config()

const loginUser = async (req, res) => {
  const { email, password } = req.body

  try {
    // Find user by email in DB
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Make sure user has a passwordHash (normal login)
    if (!user.passwordHash) {
      return res
        .status(400)
        .json({ message: 'Please login using OAuth provider' })
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    })

    console.log(token)

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    })

    res.status(200).json({ message: 'Login successful', user: user })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const signupUser = async (req, res) => {
  const { name, email, password } = req.body

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'User with this email already exists' })
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create new user document
    const newUser = new User({
      name,
      email,
      passwordHash,
    })

    // Save to database
    await newUser.save()

    // Create JWT token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    })

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    })

    res
      .status(201)
      .json({ message: 'User registered successfully', user: newUser })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const googleLogin = async (req, res) => {
  try {
    const { name, email, providerId, avatar } = req.body
    console.log(req.body)

    if (!email || !providerId) {
      return res.status(400).json({ message: 'Invalid user data' })
    }

    // Check if user exists
    let user = await User.findOne({ email })

    // If not, create a new user
    if (!user) {
      user = new User({
        name,
        email,
        providerId,
        avatar,
        authType: 'google',
      })

      await user.save()
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    })
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    })
    
    // Respond with user and token
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token,
    })
  } catch (err) {
    console.error('Google auth failed:', err)
    res.status(500).json({ message: 'Google login failed' })
  }
}

const logoutUser = (req, res) => {
  // Clear the cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })

  res.status(200).json({ message: 'Logout successful' })
}

module.exports = {
  loginUser,
  signupUser,
  logoutUser,
  googleLogin,
}
