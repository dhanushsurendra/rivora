require('dotenv').config()
const nodemailer = require('nodemailer')
const Session = require('../models/session')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const axios = require('axios')

const { processSession } = require('../merge/merge')

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

  if (!sessionId || !guestEmail || !userId || !guestName) {
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
      role: 'audience',
    }

    const guestToken = jwt.sign(guestPayload, process.env.JWT_SECRET)
    const participantToken = jwt.sign(
      participantPayload,
      process.env.JWT_SECRET
    )

    session.guest = {
      name: guestName,
      email: guestEmail,
      token: guestToken,
      hasJoined: false,
    }

    await session.save()

    const inviteLink = `${process.env.FRONTEND_URL}/device-setup/${guestToken}`
    const audienceLink = `${process.env.FRONTEND_URL}/device-setup/${participantToken}`

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: guestEmail,
      subject: `Invitation to join the session "${
        session.title || 'Untitled Session'
      }"`,
      html: `
        <div style="font-family: 'Inter', sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; margin-bottom: 15px;">Hi <strong style="color: #333333;">${guestName}</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 15px;">You have been invited to join a studio session by <strong style="color: #333333;">${user.name}</strong>:</p>
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

    res.status(200).json({
      message: `Invite sent to ${guestEmail}`,
      audienceLink,
    })
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

const mergeVideos = async (req, res) => {
  const { sessionId } = req.body

  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required.' })
  }

  try {
    // Call the processSession function to handle merging
    const { hostUrl, guestUrl, mergedUrl } = await processSession(sessionId)

    await Session.findByIdAndUpdate(sessionId, {
      $set: {
        'mergedVideo.host': hostUrl,
        'mergedVideo.guest': guestUrl,
        'mergedVideo.finalMerged': mergedUrl,
        isLive: false,
      },
    })

    const session = await Session.findById(sessionId)

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' })
    }

    const sessionLink = `${process.env.FRONTEND_URL}/my-studios/${sessionId}`

    const user = await User.findById(session.host)

    if (!user) {
      return res.status(404).json({ message: 'Host user not found.' })
    }

    await transporter.sendMail({
      from: `Rivora - ${process.env.SMTP_USER}`,
      to: user.email,
      subject: 'Your podcast session is ready to download!',
      html: `
        <div style="font-family: 'Inter', sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; margin-bottom: 15px;">Hi <strong style="color: #333333;">${
              session?.host?.name || 'Host'
            }</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 15px;">Your studio session videos have been successfully merged and are ready for download!</p>
            <p style="font-size: 16px; margin-bottom: 25px;">You can access and download your merged videos from the session details page:</p>
            <p style="text-align: center; margin-bottom: 25px;">
                <a href="${sessionLink}" style="display: inline-block; padding: 12px 25px; background-color: #8A65FD; color: #ffffff; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; transition: background-color 0.3s ease;" target="_blank">
                    View & Download Videos
                </a>
            </p>
            <p style="font-size: 14px; color: #666666; text-align: center; margin-top: 30px;">
                Thank you for using Rivora Studio!
            </p>
            <p style="font-size: 12px; color: #999999; text-align: center; margin-top: 20px;">
                &copy; 2025 Rivora. All rights reserved.
            </p>
        </div>
        `,
    })

    res.status(200).json({ message: 'Videos merged successfully.' })
  } catch (error) {
    console.error('Error merging videos:', error)
    res.status(500).json({ message: 'Server error merging videos.' })
  }
}

const generateToken = async (req, res) => {
  const { sessionId, role, userName } = req.body;

  if (!sessionId || !role || !userName) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  // Call 100ms API to generate token
  // const response = await fetch('https://prod-in.100ms.live/hmsapi/your-subdomain.app.100ms.live/api/token', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': 'Bearer ' + YOUR_MANAGEMENT_TOKEN,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     user_id: userName,
  //     role,
  //     room_id: ,
  //   }),
  // });

  const data = await response.json();

  // Optional: you can also sign your own token (JWT) that includes role/sessionId if needed
  res.status(200).json({ token: data.token });
}

async function create100msRoom(title) {
  try {
    const response = await axios.post(
      'https://api.100ms.live/v2/rooms',
      {
        name: `room_${Date.now()}`, // unique room name
        description: title,
        template_id: process.env.HMS_TEMPLATE_ID, // your template
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HMS_MANAGEMENT_TOKEN}`, // from 100ms dashboard
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.id // this is the roomId
  } catch (error) {
    console.error('❌ Failed to create 100ms room:', error.message)
    throw new Error('Failed to create room with 100ms')
  }
}

// --- createSession Controller ---
const createSession = async (req, res) => {
  const { title, scheduledAt, host } = req.body

  if (!title || !scheduledAt || !host) {
    return res.status(400).json({ message: 'Missing required fields.' })
  }

  try {
    // const roomId = await create100msRoom(title)

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

// controllers/sessionController.js
// ... (existing imports and code like transporter, sendInvitation, createSession) ...

// --- NEW: Controller to get all sessions for the *authenticated* host ---
const getMySessions = async (req, res) => {
  // Use the userId from the authenticated token (req.user._id)
  console.log(req.cookies.token)
  const hostId = req.user._id
  //   console.log(req.user)

  try {
    const sessions = await Session.find({ host: hostId }).populate(
      'host',
      'name email'
    )

    if (!sessions || sessions.length === 0) {
      return res
        .status(404)
        .json({ message: 'No sessions found for your account.' })
    }

    res
      .status(200)
      .json({ message: 'Your sessions fetched successfully', sessions })
  } catch (error) {
    console.error('Error fetching sessions by authenticated host:', error)
    res.status(500).json({ message: 'Server error fetching your sessions.' })
  }
}

// --- Updated: Controller to get a single session by ID with authorization check ---
const getSessionById = async (req, res) => {
  const { sessionId } = req.params // Get sessionId from URL parameters
  const authenticatedUserId = req.user._id // Get the ID of the authenticated user

  try {
    const session = await Session.findById(sessionId).populate(
      'host',
      'name email'
    )

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' })
    }

    if (session.host._id.toString() !== authenticatedUserId.toString()) {
      return res.status(403).json({
        message:
          'Forbidden: You do not have permission to access this session.',
      })
    }

    const hostPayload = {
      sessionId: sessionId,
      role: 'host',
    }

    const hostToken = jwt.sign(hostPayload, process.env.JWT_SECRET)

    res
      .status(200)
      .json({ message: 'Session fetched successfully', session, hostToken })
  } catch (error) {
    console.error('Error fetching session by ID:', error)
    res.status(500).json({ message: 'Server error fetching session.' })
  }
}

module.exports = {
  sendInvitation,
  createSession,
  getMySessions,
  getSessionById,
  mergeVideos,
}
