const express = require('express')
const {
  sendInvitation,
  createSession,
  getMySessions,
  getSessionById,
  uploadChunk
} = require('../controllers/sessionController.js')
const authenticateToken = require('../middlewares/authenticationToken.js')

const router = express.Router()
router.post('/send-invitation', authenticateToken, sendInvitation)
router.post('/create-session', authenticateToken, createSession)
router.post('/:sessionId/upload-chunk', authenticateToken, uploadChunk);

router.get('/my-sessions', authenticateToken, getMySessions)
router.get('/:sessionId', authenticateToken, getSessionById)

module.exports = router
