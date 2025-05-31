// src/pages/StudioDetailsPage.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify'
import axiosInstance from '../api/axios'
import Button from '../components/Button/Button'
import { MoonLoader } from 'react-spinners'
import Header from '../components/Header'

// Reusable icons (adjusted for better visual harmony)
const ClockIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    className='h-6 w-6 mr-4 text-gray-400 flex-shrink-0' // Increased size, margin, added color, and flex-shrink-0
    viewBox='0 0 20 20'
    fill='currentColor'
  >
    <path
      fillRule='evenodd'
      d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L11 9.586V6z'
      clipRule='evenodd'
    />
  </svg>
)
const UserIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    className='h-6 w-6 mr-4 text-gray-400 flex-shrink-0' // Increased size, margin, added color, and flex-shrink-0
    viewBox='0 0 20 20'
    fill='currentColor'
  >
    <path
      fillRule='evenodd'
      d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
      clipRule='evenodd'
    />
  </svg>
)
const StatusDot = ({ color }) => (
  <span className={`h-3 w-3 rounded-full ${color} mr-3 flex-shrink-0`}></span> // Adjusted size and margin, added flex-shrink-0
)

// Simple Video Player Component
const VideoPlayer = ({ src, title }) => (
  <div className='bg-[#1E1E1E] rounded-lg overflow-hidden shadow-xl border border-[#2e2e2e] hover:border-[#8A65FD] transition-colors duration-300'>
    <video
      controls
      src={src}
      className='w-full h-auto max-h-56 object-cover'
      preload='metadata'
    >
      Your browser does not support the video tag.
    </video>
    <p className='p-3 text-sm font-medium text-gray-300 truncate'>{title}</p>
  </div>
)

// Chat Message Component for better styling
const ChatMessage = ({ senderName, senderRole, message, sentAt }) => {
  const isHost = senderRole === 'host'
  const roleColor = isHost ? 'text-blue-400' : 'text-purple-400'
  const bubbleBg = isHost ? 'bg-[#333344]' : 'bg-[#333333]' // Slightly different shade for host messages

  return (
    <div
      className={`flex items-start mb-3 ${
        isHost ? 'justify-end' : 'justify-start'
      }`}
    >
      <div className={`p-3 rounded-lg max-w-[80%] ${bubbleBg} shadow-sm`}>
        <div className='flex items-baseline mb-1'>
          <span className={`font-semibold ${roleColor}`}>{senderName}</span>
          <span className='text-gray-500 text-xs ml-2'>({senderRole})</span>
          <span className='text-gray-500 text-xs ml-auto'>
            {new Date(sentAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <p className='text-gray-200 text-sm break-words'>{message}</p>
      </div>
    </div>
  )
}

const StudioDetailsPage = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [studio, setStudio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const tempVideoClips = [
    {
      id: 'v1',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      title: 'Session Highlights Part 1',
    },
    {
      id: 'v2',
      url: 'https://www.w3schools.com/html/movie.mp4',
      title: 'Session Highlights Part 2 (Short)',
    },
    {
      id: 'v3',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      title: 'Full Recording (Example)',
    },
  ]

  const dummyTranscript =
    'This is a placeholder for the session transcript. In a real application, this would be generated from the audio recording. It could include speaker identification and timestamps. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'

  const dummyChatMessages = [
    {
      senderName: 'Alice (Host)',
      senderRole: 'host',
      message: 'Welcome everyone! Glad you could make it.',
      sentAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      senderName: 'Bob (Guest)',
      senderRole: 'guest',
      message: 'Hey Alice! Ready to start.',
      sentAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    },
    {
      senderName: 'Charlie (Participant)',
      senderRole: 'participant',
      message: 'Good to be here. Excited for this session!',
      sentAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
    {
      senderName: 'Alice (Host)',
      senderRole: 'host',
      message:
        "Just a quick reminder, we'll be discussing the Q2 marketing strategy today. Feel free to ask questions in the chat as we go along. This is a slightly longer message to test wrapping and display.",
      sentAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    },
    {
      senderName: 'Bob (Guest)',
      senderRole: 'guest',
      message:
        'Sounds great! I have a few questions already about the budget allocation.',
      sentAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    },
    {
      senderName: 'Alice (Host)',
      senderRole: 'host',
      message:
        "Perfect, Bob. We'll address those after the initial presentation. Let's get started!",
      sentAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      senderName: 'Charlie (Participant)',
      senderRole: 'participant',
      message: 'Looking forward to it!',
      sentAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    },
    {
      senderName: 'Alice (Host)',
      senderRole: 'host',
      message:
        'And for anyone who joined late, a recording will be available after the session.',
      sentAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
    {
      senderName: 'Bob (Guest)',
      senderRole: 'guest',
      message: "Thanks for the reminder, Alice. That's helpful!",
      sentAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      senderName: 'Alice (Host)',
      senderRole: 'host',
      message: "You're welcome! Enjoy the session.",
      sentAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    },
  ]

  useEffect(() => {
    const fetchStudioDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await axiosInstance.get(`/session/${sessionId}`)
        setStudio({
          ...response.data.session,
          videoClips: tempVideoClips,
          transcript: dummyTranscript,
          chatMessages: dummyChatMessages,
        })
      } catch (err) {
        console.error('Error fetching studio details:', err)
        const errorMessage =
          err.response?.data?.message || 'Failed to fetch studio details.'
        setError(errorMessage)
        toast.error(errorMessage, { theme: 'dark' })
        if (err.response?.status === 404 || err.response?.status === 403) {
          navigate('/my-studios')
        }
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchStudioDetails()
    }
  }, [sessionId, navigate])

  if (loading) {
    return (
      <div className='bg-[#1A1A1A] min-h-screen flex items-center justify-center text-white'>
        <MoonLoader color='#8A65FD' size={60} />
      </div>
    )
  }

  if (error) {
    return (
      <div className='bg-[#1A1A1A] min-h-screen flex flex-col items-center justify-center text-white p-8'>
        <p className='text-red-500 text-xl mb-4'>Error: {error}</p>
        <Button
          onClick={() => navigate('/my-studios')}
          text='Back to Studios'
          className='bg-gray-700 hover:bg-gray-600'
        />
      </div>
    )
  }

  if (!studio) {
    return (
      <div className='bg-[#1A1A1A] min-h-screen flex flex-col items-center justify-center text-white p-8'>
        <p className='text-lg mb-4'>Studio not found.</p>
        <Button
          onClick={() => navigate('/my-studios')}
          text='Back to Studios'
          className='bg-gray-700 hover:bg-gray-600'
        />
      </div>
    )
  }

  const sessionScheduledTime = new Date(studio.scheduledAt)
  const currentTime = new Date()

  const SESSION_DEFAULT_DURATION_MINUTES = 90
  const sessionEndTime = new Date(
    sessionScheduledTime.getTime() +
      SESSION_DEFAULT_DURATION_MINUTES * 60 * 1000
  )

  const isLive =
    studio.isLive ||
    (currentTime >= sessionScheduledTime && currentTime < sessionEndTime)
  const isOver = currentTime >= sessionEndTime
  const isScheduledForFuture = currentTime < sessionScheduledTime

  const handleJoinNow = () => {
    if (isScheduledForFuture) {
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }
      const formattedTime = sessionScheduledTime.toLocaleString(
        undefined,
        options
      )
      toast.info(
        `Session is scheduled for ${formattedTime}. Please wait until then.`,
        { theme: 'dark', autoClose: 5000 }
      )
    } else if (isOver) {
      toast.info(
        'This session has already ended. You can view recordings if available.',
        { theme: 'dark', autoClose: 5000 }
      )
    } else {
      navigate(`/device-setup/${sessionId}`)
    }
  }

  return (
    <div className='bg-[#1A1A1A] min-h-screen text-white font-sans'>
      <Header />

      <main className='max-w-7xl mx-auto px-4 py-8'>
        <div className='flex flex-col md:flex-row md:items-center justify-between mb-8'>
          <h1 className='text-4xl md:text-5xl font-extrabold text-white mb-4 md:mb-0'>
            {studio.title}
          </h1>
          <Button
            text='Back to My Studios'
            onClick={() => navigate('/my-studios')}
            className='bg-gray-700 hover:bg-gray-600'
          />
        </div>

        {/* Session Overview Section */}
        <div className='bg-[#252525] rounded-lg p-6 mb-8 shadow-xl border border-[#333333]'>
          <h2 className='text-2xl font-bold text-white mb-6'>
            Session Overview
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {/* Card for Host */}
            <div
              className='
                flex items-center p-5 bg-[#1E1E1E] rounded-lg
                shadow-md border border-[#2e2e2e]
                hover:border-[#8A65FD] hover:shadow-lg
                transition-all duration-300
                '
            >
              <UserIcon /> {/* Now with h-6 w-6 mr-4 text-gray-400 */}
              <div>
                <p className='font-medium text-sm text-gray-400'>Host</p>
                <p className='text-lg font-semibold text-white'>
                  {studio.host?.name || 'N/A'}
                </p>
              </div>
            </div>
            {/* Card for Scheduled Time */}
            <div
              className='
                    flex items-center p-5 bg-[#1E1E1E] rounded-lg
                    shadow-md border border-[#2e2e2e]
                    hover:border-[#8A65FD] hover:shadow-lg
                    transition-all duration-300
                    '
            >
              <ClockIcon /> {/* Now with h-6 w-6 mr-4 text-gray-400 */}
              <div>
                <p className='font-medium text-sm text-gray-400'>
                  Scheduled At
                </p>
                <p className='text-lg font-semibold text-white'>
                  {sessionScheduledTime.toLocaleString()}
                </p>
              </div>
            </div>
            {/* Card for Status */}
            <div
              className='
                flex items-center p-5 bg-[#1E1E1E] rounded-lg
                shadow-md border border-[#2e2e2e]
                hover:border-[#8A65FD] hover:shadow-lg
                transition-all duration-300
                '
            >
              {!isLive && (
                <StatusDot
                  color={
                    isLive
                      ? 'bg-green-500'
                      : isOver
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }
                />
              )}
              {/* Now h-3 w-3 mr-3 */}
              <div>
                <p className='font-medium text-sm text-gray-400'>Status</p>
                <p className='text-lg font-semibold'>
                  {isLive ? (
                    <span className='text-green-400 flex items-center'>
                      <span className='h-3 w-3 rounded-full bg-green-500 animate-pulse mr-3'></span>{' '}
                      Live Now
                    </span>
                  ) : isOver ? (
                    <span className='text-red-400'>Ended</span>
                  ) : (
                    <span className='text-yellow-400'>Upcoming</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className='mt-8 flex items-center space-x-4'>
            {!isOver && (
              <Button
                text={
                  isLive
                    ? 'Join Now'
                    : isScheduledForFuture
                    ? 'Wait for Session'
                    : 'View Session Info'
                }
                onClick={handleJoinNow}
                className={`
                  rounded-lg py-3 px-8 text-lg font-bold
                  ${
                    isLive
                      ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30'
                      : isScheduledForFuture
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : 'bg-[#8A65FD] hover:bg-[#6f4ed1] shadow-lg shadow-[#8A65FD]/30'
                  }
                `}
                disabled={isScheduledForFuture}
              />
            )}
            {studio.guest && studio.guest.email && (
              <p className='text-sm text-gray-400'>
                Guest Invited:{' '}
                <span className='text-white'>{studio.guest.email}</span>
              </p>
            )}
          </div>
        </div>

        {isOver && (
          <div className='bg-[#252525] rounded-lg p-6 my-8 shadow-xl border border-[#333333]'>
            <h2 className='text-2xl font-bold text-white mb-6'>
              Post-Session Content
            </h2>

            <h3 className='text-xl font-semibold text-white mb-4 border-b border-[#333333] pb-2'>
              Recordings & Clips
            </h3>
            {studio.videoClips && studio.videoClips.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {studio.videoClips.map((clip) => (
                  <VideoPlayer
                    key={clip.id}
                    src={clip.url}
                    title={clip.title}
                  />
                ))}
              </div>
            ) : (
              <p className='text-gray-400 mb-6'>
                No video recordings or clips available for this session yet.
              </p>
            )}

            <h3 className='text-xl font-semibold text-white mt-8 mb-4 border-b border-[#333333] pb-2'>
              Transcript
            </h3>
            {studio.transcript ? (
              <div className='bg-[#1E1E1E] p-4 rounded-md text-gray-300 leading-relaxed shadow-inner max-h-64 overflow-y-auto'>
                <p>{studio.transcript}</p>
              </div>
            ) : (
              <p className='text-gray-400'>Transcript not available yet.</p>
            )}

            <h3 className='text-xl font-semibold text-white mt-8 mb-4 border-b border-[#333333] pb-2'>
              Downloads
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Button
                text='Download Full Recording (MP4)'
                className='bg-blue-600 hover:bg-blue-700'
              />
              <Button
                text='Download Audio Only (MP3)'
                className='bg-blue-600 hover:bg-blue-700'
              />
              <Button
                text='Download Chat Transcript (TXT)'
                className='bg-blue-600 hover:bg-blue-700'
              />
            </div>
          </div>
        )}

        <div className='bg-[#252525] rounded-lg p-6 my-8 shadow-xl border border-[#333333]'>
          <h2 className='text-2xl font-bold text-white mb-6'>Session Chat</h2>
          <div className='bg-[#1E1E1E] p-4 rounded-lg h-80 overflow-y-auto border border-[#2e2e2e]'>
            {studio.chatMessages && studio.chatMessages.length > 0 ? (
              studio.chatMessages.map((msg, index) => (
                <ChatMessage key={index} {...msg} />
              ))
            ) : (
              <p className='text-gray-500'>No chat messages available yet.</p>
            )}
          </div>
        </div>
      </main>
      <ToastContainer />
    </div>
  )
}

export default StudioDetailsPage
