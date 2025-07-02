import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useHMSActions,
  useVideo,
  useHMSStore,
  selectPeers,
  selectIsConnectedToRoom,
  selectLocalPeer,
  selectHMSMessages,
  useAVToggle,
} from '@100mslive/react-sdk'
import axiosInstance from '../api/axios'

import { useSelector } from 'react-redux'
import VideoControls from '../components/VideoControls'
import Header from '../components/PodcastHeader'
import useLocalRecorder from '../hooks/useLocalRecorder'
import { toast, ToastContainer } from 'react-toastify'

// Import icons for VideoTile
import { IoMicOffOutline } from 'react-icons/io5'
import { IoVideocamOffOutline } from 'react-icons/io5'

const StudioPage = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const studioData = useSelector((state) => state.studio.studioJoinData)
  const session = useSelector((state) => state.session.session)
  const localPeer = useHMSStore(selectLocalPeer)
  const peers = useHMSStore(selectPeers)
  const isConnected = useHMSStore(selectIsConnectedToRoom)
  const hmsMessages = useHMSStore(selectHMSMessages)
  const [recordingStopped, setRecordingStopped] = useState(false)
  const hasBroadcastedRef = useRef(false) // Ref to prevent multiple guest 'upload-complete' broadcasts

  const [showSlider, setShowSlider] = useState(false)
  const [volume, setVolume] = useState(50)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const { isLocalAudioEnabled, isLocalVideoEnabled, toggleAudio, toggleVideo } =
    useAVToggle()

  const role = studioData?.role || 'guest'
  const userName = studioData?.userName || 'User'
  const {
    isRecording,
    startRecording,
    stopRecording,
    isUploading,
    uploadProgress,
  } = useLocalRecorder(sessionId, role)

  const hmsActions = useHMSActions()

  // Ref to track the number of messages already processed
  const processedMessageCountRef = useRef(0) // <--- New/Corrected usage for message processing

  // Function to trigger host upload (memoized for stability)
  const triggerHostUpload = useCallback(async (currentSessionId) => {
    if (!currentSessionId) {
      console.warn('❌ triggerHostUpload: Session ID is missing.')
      return
    }

    if (isUploading) {
      console.warn('❌ triggerHostUpload: uploading chunks.')
      return
    }

    console.log('📤 Triggering host upload for session:', currentSessionId)
    try {
      toast.success('Video merging process initiated on server!', {
        theme: 'dark',
      })
      await axiosInstance.post('/session/merge-videos', {
        sessionId: currentSessionId,
      })
      console.log('✅ Merge video request sent successfully.')
    } catch (error) {
      console.error('❌ Error sending merge video request:', error)
      toast.error(`Failed to initiate merge: ${error.message}`, {
        theme: 'dark',
      })
    }
  }, [])

  // Effect to handle joining the room
  useEffect(() => {
    if (!isConnected) {
      const joinRoom = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
          stream.getTracks().forEach((track) => track.stop())
          console.log('✅ Got user media permissions.')

          const token =
            role === 'host'
              ? import.meta.env.VITE_100MS_HOST_TOKEN
              : import.meta.env.VITE_100MS_GUEST_TOKEN

          if (!token) {
            console.error('❌ 100MS Token is missing for role:', role)
            toast.error('Failed to join: Missing authentication token.', {
              theme: 'dark',
            })
            return
          }

          await hmsActions.join({
            userName,
            authToken: token,
            settings: { isAudioMuted: false, isVideoMuted: false },
          })

          console.log('✅ Joined room successfully as', role, ':', userName)
        } catch (err) {
          console.error('❌ Failed to join room:', err)
          toast.error(`Join failed: ${err.message}`, { theme: 'dark' })
        }
      }
      joinRoom()
    }
  }, [isConnected, hmsActions, role, userName])

  // Effect to listen for recording control messages from other peers
  useEffect(() => {
    // Process only new messages since the last render
    const newMessages = hmsMessages.slice(processedMessageCountRef.current)

    if (newMessages.length === 0) {
      return // No new messages to process
    }

    newMessages.forEach((latestMessage) => {
      // Safeguard: Ignore messages from self if they are intended for remote control.
      if (localPeer?.id === latestMessage.sender) {
        console.log('Ignoring own message:', latestMessage.message)
        return // Skip processing this message
      }

      try {
        const data = JSON.parse(latestMessage.message)
        console.log(
          `Received message (type: ${data.type}) from ${
            latestMessage.senderName
          } (${latestMessage.sender}) at ${new Date(latestMessage.time)}`
        )
        console.log('Message data:', data)

        if (data.type === 'start-recording') {
          if (!isRecording) {
            console.log(
              'Host/Guest: Received start-recording. Starting local recording...'
            )
            startRecording()
          } else {
            console.log(
              'Host/Guest: Received start-recording but already recording.'
            )
          }
        } else if (data.type === 'stop-recording') {
          if (isRecording) {
            console.log(
              'Host/Guest: Received stop-recording. Stopping local recording...'
            )
            stopRecording()
            if (role === 'guest') {
              console.log('Guest: Setting recordingStopped flag.')
              setRecordingStopped(true) // Trigger guest upload broadcast after local upload finishes
            }
          } else {
            console.log(
              'Host/Guest: Received stop-recording but not recording.'
            )
          }
        } else if (data.type === 'upload-complete') {
          if (role === 'host') {
            // Only host processes 'upload-complete' messages
            console.log('Host: Received upload-complete message from a guest.')
            triggerHostUpload(sessionId) // Use the useCallback version
          } else {
            console.log(
              'Guest: Received upload-complete (ignoring, as I am guest).'
            )
          }
        }
      } catch (err) {
        console.error(
          'Invalid message format or processing error:',
          err,
          'Message:',
          latestMessage.message
        )
      }
    })

    // Update the ref after processing all new messages
    processedMessageCountRef.current = hmsMessages.length
  }, [
    hmsMessages,
    localPeer,
    role,
    isRecording,
    startRecording,
    stopRecording,
    triggerHostUpload,
    sessionId,
  ])

  // Effect for GUEST to broadcast 'upload-complete'
  useEffect(() => {
    console.log('Guest upload broadcast effect:', {
      recordingStopped,
      isUploading,
      role,
      hasBroadcasted: hasBroadcastedRef.current,
    })
    if (
      recordingStopped &&
      !isUploading &&
      role === 'guest' &&
      !hasBroadcastedRef.current
    ) {
      console.log(
        '📤 Guest: All conditions met. Sending upload-complete broadcast...'
      )
      hmsActions.sendBroadcastMessage(
        JSON.stringify({ type: 'upload-complete', userName, sessionId })
      )
      hasBroadcastedRef.current = true
      setRecordingStopped(false)
      toast.success('Your recording has finished uploading!', { theme: 'dark' })
    }
  }, [isUploading, recordingStopped, role, hmsActions, userName, sessionId])

  // Effect for browser tab close/refresh warning
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isUploading || isRecording) {
        event.preventDefault()
        event.returnValue = ''
        return 'Recording or uploading in progress. Are you sure you want to leave? Your data may be lost.'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isUploading, isRecording])

  // Effect for leaving the room on component unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        hmsActions.leave()
        console.log('🧹 Left room on unmount')
      }
    }
  }, [hmsActions, isConnected])

  // Host-initiated recording actions
  const handleStartRecording = async () => {
    if (localPeer?.roleName === 'host') {
      console.log('Host: Initiating start recording...')
      await hmsActions.sendBroadcastMessage(
        JSON.stringify({ type: 'start-recording' })
      )
      startRecording()
    } else {
      console.log('Not host, cannot start recording from UI.')
    }
  }

  const handleStopRecording = async () => {
    if (localPeer?.roleName === 'host') {
      console.log('Host: Initiating stop recording...')
      await hmsActions.sendBroadcastMessage(
        JSON.stringify({ type: 'stop-recording' })
      )
      stopRecording()
    } else {
      console.log('Not host, cannot stop recording from UI.')
    }
  }

  // Function to handle the actual end call logic (after confirmation)
  const confirmEndCall = async () => {
    setShowConfirmModal(false)
    try {
      if (role === 'host') {
        console.log('Host: Ending room...')
        await hmsActions.endRoom(true, 'Host ended the call')
        navigate('/my-studios')
      } else {
        console.log('Guest: Leaving room...')
        await hmsActions.leave()
        navigate('/')
      }
      toast.info('Call ended.', { theme: 'dark' })
    } catch (err) {
      console.error('Error ending call:', err)
      toast.error(`Error ending call: ${err.message}`, { theme: 'dark' })
    }
  }

  // Modified handleEndCall to include warning
  const handleEndCall = () => {
    if (isUploading) {
      setShowConfirmModal(true)
    } else {
      confirmEndCall()
    }
  }

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-[#111111] text-white font-sans'>
      <div className='flex flex-1 overflow-hidden'>
        <div className='flex flex-col flex-1 '>
          <Header
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            title={session?.title || 'Studio'}
            participantCount={peers.length}
            userInitial={userName.charAt(0).toUpperCase() || 'U'}
          />
          <main className='flex-1 p-4 flex flex-row items-stretch justify-center space-x-4 min-h-0'>
            {peers.length === 0 ? (
              <div className='flex items-center justify-center text-gray-400 text-2xl border border-dashed border-gray-600 rounded-lg w-full h-full'>
                Connecting to session...
              </div>
            ) : peers.length === 1 ? (
              <div className='flex w-full space-x-4 h-full'>
                <div className='flex-1 h-full bg-black rounded-lg overflow-hidden border border-gray-700 flex items-center justify-center relative min-h-0'>
                  <VideoTile peer={peers[0]} role={role} userName={userName} />
                </div>
                <div className='flex-1 h-full flex items-center justify-center text-gray-400 text-2xl border border-dashed border-gray-600 rounded-lg min-h-0'>
                  Waiting for another participant...
                </div>
              </div>
            ) : (
              peers.slice(0, 2).map((peer) => (
                <div
                  key={peer.id}
                  className='w-1/2 h-full bg-black rounded-lg overflow-hidden border border-gray-700 flex items-center justify-center relative min-h-0'
                >
                  <VideoTile peer={peer} role={role} userName={userName} />
                </div>
              ))
            )}
          </main>

          <VideoControls
            handleStartRecording={handleStartRecording}
            handleStopRecording={handleStopRecording}
            isRecording={isRecording}
            isAudioMuted={!isLocalAudioEnabled}
            isVideoMuted={!isLocalVideoEnabled}
            toggleAudio={toggleAudio}
            toggleVideo={toggleVideo}
            handleEndCall={handleEndCall}
            showSlider={showSlider}
            volume={volume}
            setVolume={setVolume}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'>
          <div className='bg-[#1F1F1F] p-6 rounded-lg shadow-xl text-white max-w-sm mx-auto'>
            <h3 className='text-lg font-semibold mb-4'>Upload in Progress!</h3>
            <p className='mb-6'>
              A recording upload is still in progress ({uploadProgress}%). If
              you leave now, this upload may be interrupted and lost. Are you
              sure you want to end the call?
            </p>
            <div className='flex justify-end space-x-4'>
              <button
                onClick={() => setShowConfirmModal(false)}
                className='px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white'
              >
                Cancel
              </button>
              <button
                onClick={confirmEndCall}
                className='px-4 py-2 rounded-lg bg-[#EE4C4D] text-white'
              >
                End Call Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  )
}

// VideoTile Component (from previous version, included for completeness)
const VideoTile = ({ peer }) => {
  const { videoRef } = useVideo({ trackId: peer.videoTrack })
  const isVideoOff = !peer.videoTrack || peer.isVideoEnabled === false

  const { isLocalAudioEnabled, isLocalVideoEnabled } = useAVToggle()

  return (
    <div className='relative w-full h-full min-h-0 bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center'>
      <video
        ref={videoRef}
        autoPlay
        muted={peer.isLocal}
        playsInline
        className={`w-full h-full min-h-full object-cover transform scale-x-[-1]`}
      />

      {isVideoOff && (
        <div className='absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-gray-400'>
          <div className='text-5xl mb-4'>
            {peer.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className='text-sm'>
            {!peer.videoTrack ? 'No video track available' : 'Video is off'}
          </div>
        </div>
      )}

      {/* Top Right Icons (Mic and Video - visible when off) */}
      <div className='absolute top-4 right-4 flex gap-2'>
        {!peer.isAudioEnabled && (
          <div className='bg-black/70 p-2 rounded-full text-white flex items-center justify-center'>
            <IoMicOffOutline className='h-5 w-5' />
          </div>
        )}
        {!peer.isVideoEnabled && (
          <div className='bg-black/70 p-2 rounded-full text-white flex items-center justify-center'>
            <IoVideocamOffOutline className='h-5 w-5' />
          </div>
        )}
      </div>

      {/* Name and role tag - Bottom Left */}
      <div className='absolute bottom-4 left-4 text-white text-sm px-4 py-1 rounded-full bg-black/70'>
        {peer.name} ({peer.roleName}) {peer.isLocal && '(You)'}
      </div>
    </div>
  )
}

export default StudioPage
