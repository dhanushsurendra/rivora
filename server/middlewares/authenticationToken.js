// middleware/authenticateToken.js
const jwt = require('jsonwebtoken')
const User = require('../models/user')

const authenticateToken = async (req, res, next) => {
  // Assume the JWT is stored in an httpOnly cookie named 'token'
  const token = req.cookies.token

  if (!token) {
    // No token found in cookies, user is not authenticated
    return res
      .status(401)
      .json({ message: 'Authentication token not found. Please log in.' })
  }

  try {
    // Verify the token using your JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // Attach the decoded user information to the request object
    // This allows subsequent middleware/controllers to access req.user
    console.log(decoded)
    const user = await User.findOne({ _id: decoded.userId })
    // console.log(user)
    if (!user) {    
      return res.status(404).json({ message: 'User not found' })
    }
    // console.log(user)
    req.user = user 
    // decoded will contain { _id: user._id, role: 'host' (or whatever you put in payload) }
    next() // Proceed to the next middleware/route handler
  } catch (error) {
    console.error('JWT verification failed:', error)
    // Token is invalid (e.g., expired, malformed)
    return res.status(403).json({ message: 'Invalid or expired token.' })
  }
}

module.exports = authenticateToken
