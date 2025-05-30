const Session = require('../models/session')
const crypto = require('crypto')
// const nodemailer = require('nodemailer')

// const transporter = nodemailer.createTransport({
//   service: 'Gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// })

// const sendInvitation = async (req, res) => {
//   const { userId, sessionId, guestEmail, guestName } = req.body

//   if (!sessionId || !guestEmail || !guestName || !userId) {
//     return res.status(400).json({ message: 'Missing required fields.' })
//   }

//   try {
//     // Find session
//     const session = await Session.findById(sessionId)
//     if (!session) return res.status(404).json({ message: 'Session not found' })

//     // Check if invite already sent
//     if (session.guest && session.guest.email === guestEmail) {
//       return res
//         .status(400)
//         .json({ message: 'Invite already sent to this guest.' })
//     }

//     // Generate token
//     const token = crypto.randomBytes(20).toString('hex')

//     // Update guest info with token
//     session.guest = {
//       name: guestName,
//       email: guestEmail,
//       token,
//       hasJoined: false,
//     }

//     await session.save()

//     // Compose invite link (adjust your frontend URL as needed)
//     const inviteLink = `${process.env.FRONTEND_URL}/join/${token}`

//     // Send email
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: guestEmail,
//       subject: `Invitation to join the session "${session.title}"`,
//       html: `<p>Hi ${guestName},</p>
//              <p>You have been invited to join the studio session "<b>${session.title}</b>".</p>
//              <p>Click <a href="${inviteLink}">here</a> to join.</p>
//              <p>If you did not expect this, please ignore this email.</p>`,
//     }

//     await transporter.sendMail(mailOptions)

//     res.status(200).json({ message: `Invite sent to ${guestEmail}` })
//   } catch (error) {
//     console.error('Error sending invite:', error)
//     res.status(500).json({ message: 'Server error' })
//   }
// }

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
//   sendInvitation,
  createSession,
}
