require('dotenv').config()
const nodemailer = require('nodemailer')
const Session = require('../models/session')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Updated sendInvitation function
const sendInvitation = async (req, res) => {
  const { sessionId, userId, guestEmail, guestName } = req.body

  if ((!sessionId || !guestEmail || !userId || !guestName)) {
    return res.status(400).json({ message: 'Missing required fields.' })
  }

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email)
  if (!isValidEmail(guestEmail)) {
    return res.status(400).json({ message: 'Invalid guest email address.' })
  }

  try {
    // Find session and user (your existing code)
    const session = await Session.findById(sessionId)
    if (!session) return res.status(404).json({ message: 'Session not found' })

    if (session.guest && session.guest.email === guestEmail) {
      return res
        .status(400)
        .json({ message: 'Invite already sent to this guest.' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'Inviting user not found.' })
    }

    // Generate token and update session (your existing code)
    const guestPayload = {
      sessionId: sessionId,
      role: 'guest',
      email: guestEmail,
    }

    const participantPayload = {
      sessionId: sessionId,
      role: 'participant',
    }

    const guestToken = jwt.sign(guestPayload, process.env.JWT_SECRET);
    const participantToken = jwt.sign(participantPayload, process.env.JWT_SECRET);

    session.guest = {
      name: guestName,
      email: guestEmail,
      token: guestToken,
      hasJoined: false,
    }

    await session.save()

    const inviteLink = `${process.env.FRONTEND_URL}/join/${guestToken}`
    const participantLink = `${process.env.FRONTEND_URL}/join/${participantToken}`

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: guestEmail,
      subject: `Invitation to join the session "${
        session.title || 'Untitled Session'
      }"`,
      html: `
        <div style="font-family: 'Inter', sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; margin-bottom: 15px;">Hi <strong style="color: #333333;">${
              (guestName)
            }</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 15px;">You have been invited to join a studio session by <strong style="color: #333333;">${
              user.name
            }</strong>:</p>
            <p style="font-size: 18px; font-weight: bold; color: #8A65FD; margin-bottom: 25px; text-align: center;">
                "<b>${session.title}</b>"
            </p>
            <p style="text-align: center; margin-bottom: 25px;">
                <a href="${inviteLink}" style="display: inline-block; padding: 12px 25px; background-color: #8A65FD; color: #ffffff; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; transition: background-color 0.3s ease;">
                    Join the Studio Session
                </a>
            </p>
            <p style="font-size: 14px; color: #666666; text-align: center; margin-top: 30px;">
                If you did not expect this, please ignore this email.
            </p>
            <p style="font-size: 12px; color: #999999; text-align: center; margin-top: 20px;">
                &copy; 2025 Rivora. All rights reserved.
            </p>
        </div>`,
    })

    res.status(200).json({ message: `Invite sent to ${guestEmail}`, participantLink: participantLink })
  } catch (error) {
    console.error('Error sending invite:', error)

    // More specific error handling
    if (error.message.includes('unauthorized_client')) {
      return res.status(500).json({
        message:
          'Email authentication failed. Please check OAuth2 configuration.',
      })
    } else if (error.code === 'EAUTH') {
      return res.status(500).json({
        message: 'Email authentication error. Please regenerate OAuth tokens.',
      })
    }

    res.status(500).json({ message: 'Server error' })
  }
}

// --- createSession Controller ---
const createSession = async (req, res) => {
  const { title, scheduledAt, host } = req.body
  console.log(req.body)

  if (!title || !scheduledAt || !host) {
    return res.status(400).json({ message: 'Missing required fields.' })
  }

  try {
    const session = new Session({
      title,
      host,
      scheduledAt: new Date(scheduledAt),
    })

    await session.save()

    res.status(201).json({ message: 'Session created successfully', session })
  } catch (error) {
    console.error('Error creating session:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  sendInvitation,
  createSession,
}
