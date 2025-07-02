// src/pages/StudioDetailsPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import axiosInstance from '../api/axios'
import Button from '../components/Button/Button'
import { MoonLoader } from 'react-spinners'
import Header from '../components/Header'
import { FaRegClock } from 'react-icons/fa6'
import { MdOutlinePerson } from 'react-icons/md'

const StatusDot = ({ color }) => (
  <span className={`h-3 w-3 rounded-full ${color} mr-3 flex-shrink-0`}></span>
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
  const bubbleBg = isHost ? 'bg-[#333344]' : 'bg-[#333333]'

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

  useEffect(() => {
    const fetchStudioDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await axiosInstance.get(`/session/${sessionId}`)
        const sessionData = response.data.session

        // Prepare video clips from mergedVideo data
        const fetchedVideoClips = []
        if (sessionData.mergedVideo) {
          if (sessionData.mergedVideo.finalMerged) {
            fetchedVideoClips.push({
              id: 'finalMerged',
              url: sessionData.mergedVideo.finalMerged,
              title: 'Final Merged Recording',
            })
          }
          if (sessionData.mergedVideo.host) {
            fetchedVideoClips.push({
              id: 'hostRecording',
              url: sessionData.mergedVideo.host,
              title: 'Host Recording',
            })
          }
          if (sessionData.mergedVideo.guest) {
            fetchedVideoClips.push({
              id: 'guestRecording',
              url: sessionData.mergedVideo.guest,
              title: 'Guest Recording',
            })
          }
        }

        setStudio({
          ...sessionData,
          hostToken: response.data.hostToken, // Assuming hostToken is directly on response.data
          videoClips: fetchedVideoClips,
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
      navigate(`/device-setup/${studio.hostToken}`)
    }
  }

  return (
    <div className='bg-[#111111] min-h-screen text-white font-sans'>
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
        <div className='bg-[#1A1A1A] rounded-lg p-6 mb-8 shadow-xl border border-[#333333]'>
          <h2 className='text-2xl font-bold text-white mb-6'>
            Session Overview
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <div
              className='
                  flex flex-col items-start p-5 bg-[#1E1E1E] rounded-lg
                  shadow-md border border-[#2e2e2e]
                  hover:border-[#8A65FD] hover:shadow-lg
                  transition-all duration-300
                  space-y-2
                '
            >
              <div className='space-y-1'>
                <div className='text-[#8A65FD] text-2xl'>
                  <MdOutlinePerson />
                </div>
                <p className='font-medium text-sm text-gray-400'>Host</p>
                <p className='text-lg font-semibold text-white'>
                  {studio.host.name}
                </p>
              </div>
            </div>
            {/* Card for Scheduled Time */}
            <div
              className='
                  flex flex-col items-start p-5 bg-[#1E1E1E] rounded-lg
                  shadow-md border border-[#2e2e2e]
                  hover:border-[#8A65FD] hover:shadow-lg
                  transition-all duration-300
                  space-y-2
                '
            >
              <div className='space-y-1'>
                <div className='text-[#8A65FD] text-2xl'>
                  <FaRegClock className='w-5 h-5' />
                </div>
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
              <div>
                <p className='font-medium text-sm text-gray-400'>Status</p>
                <div className='flex items-center'>
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

        {!studio.isLive && (
          <div className='bg-[#252525] rounded-lg p-6 my-8 shadow-xl border border-[#333333]'>
            <h2 className='text-2xl font-bold text-white mb-6'>
              Post-Session Content
            </h2>

            <h3 className='text-xl font-semibold text-white mb-4 border-b border-[#333333] pb-2'>
              Recordings & Clips
            </h3>
            {/* Display actual video clips if available */}
            {studio.videoClips && studio.videoClips.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {studio.videoClips.map((clip) => (
                  <div key={clip.id} className='flex flex-col space-y-2'>
                    <div className='w-full aspect-video bg-black rounded-lg overflow-hidden'>
                      <VideoPlayer
                        src={clip.url}
                        title={clip.title}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <Button
                      text={`Download ${clip.title}`} // Dynamic button text
                      className='bg-blue-600 hover:bg-blue-700'
                      onClick={() => window.open(clip.url, '_blank')}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-gray-400 mb-6'>
                No video recordings or clips available for this session yet.
              </p>
            )}
          </div>
        )}
      </main>
      <ToastContainer />
    </div>
  )
}

export default StudioDetailsPage
