const jwt = require('jsonwebtoken')
const User = require('../models/user')

const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Authentication token not found. Please log in.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findOne({ _id: decoded.userId })
    if (!user) {    
      return res.status(404).json({ message: 'User not found' })
    }
    req.user = user 
    next() 
  } catch (error) {
    console.error('JWT verification failed:', error)
    return res.status(403).json({ message: 'Invalid or expired token.' })
  }
}

module.exports = authenticateToken
