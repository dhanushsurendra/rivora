const express = require('express')
const { sendInvitation, createSession } = require('../controllers/sessionController.js')

router = express.Router()
router.post('/send-invitation', sendInvitation)
router.post('/create-session', createSession)

module.exports = router
