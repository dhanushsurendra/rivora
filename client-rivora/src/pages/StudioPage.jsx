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

import { useSelector } from 'react-redux'
import VideoControls from '../components/VideoControls'
import Header from '../components/PodcastHeader'
import useLocalRecorder from '../hooks/useLocalRecorder'
import { toast } from 'react-toastify' // Assuming toast is available for notifications

// Import icons for VideoTile
import { IoMicOutline, IoVideocamOutline } from 'react-icons/io5'

const StudioPage = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const studioData = useSelector((state) => state.studio.studioJoinData)
  const session = useSelector((state) => state.session.session)
  const localPeer = useHMSStore(selectLocalPeer)
  const peers = useHMSStore(selectPeers)
  const isConnected = useHMSStore(selectIsConnectedToRoom)
  const hmsMessages = useHMSStore(selectHMSMessages)

  const [showSlider, setShowSlider] = useState(false)
  const [volume, setVolume] = useState(50)
  const [showConfirmModal, setShowConfirmModal] = useState(false) // State for the confirmation modal

  const previousMessageCount = useRef(0)

  const { isLocalAudioEnabled, isLocalVideoEnabled, toggleAudio, toggleVideo } =
    useAVToggle()

  const role = studioData?.role || 'guest'
  const userName = studioData?.userName || 'User'
  const {
    isRecording,
    startRecording,
    stopRecording,
    uploadedChunkUrls,
    isUploading, // Get isUploading state from hook
    uploadProgress, // Get uploadProgress state from hook
  } = useLocalRecorder(sessionId, role)

  const hmsActions = useHMSActions()

  // Effect to handle joining the room
  useEffect(() => {
    if (!isConnected) {
      const joinRoom = async () => {
        try {
          // Request media permissions first
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
          // Stop tracks immediately after checking permissions, as useLocalRecorder will get its own stream
          stream.getTracks().forEach((track) => track.stop())
          console.log('✅ Got user media permissions.')

          const token =
            role === 'host'
              ? import.meta.env.VITE_100MS_HOST_TOKEN
              : import.meta.env.VITE_100MS_GUEST_TOKEN

          await hmsActions.join({
            userName,
            authToken: token,
            settings: { isAudioMuted: false, isVideoMuted: false },
          })

          console.log('✅ Joined room successfully')
        } catch (err) {
          console.error('❌ Failed to join room:', err)
          toast.error(`Join failed: ${err.message}`, { theme: 'dark' })
        }
      }
      joinRoom()
    }
  }, [isConnected, hmsActions, role, sessionId, userName])

  // Effect to listen for recording control messages
  useEffect(() => {
    if (hmsMessages.length > previousMessageCount.current) {
      const newMessages = hmsMessages.slice(previousMessageCount.current)
      previousMessageCount.current = hmsMessages.length

      newMessages.forEach((msg) => {
        if (localPeer?.id === msg.sender && localPeer?.roleName === 'host') {
          return
        }
        try {
          const data = JSON.parse(msg.message)

          // Only guests should handle messages (host triggers directly and also receives broadcast)
          // The host also calls startRecording/stopRecording directly, so this ensures guests react.
          if (data.type === 'start-recording') {
            startRecording()
          } else if (data.type === 'stop-recording') {
            stopRecording()
          }
        } catch (err) {
          console.error('Invalid JSON in message:', msg.message, err)
        }
      })
    }
  }, [hmsMessages, localPeer, startRecording, stopRecording])

  // Effect for browser tab close/refresh warning
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isUploading || isRecording) {
        // Warn if recording or actively uploading
        event.preventDefault()
        event.returnValue = '' // Required for Chrome to show confirmation
        return 'Recording or uploading in progress. Are you sure you want to leave? Your data may be lost.'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isUploading, isRecording]) // Depend on isUploading and isRecording

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
      await hmsActions.sendBroadcastMessage(
        JSON.stringify({ type: 'start-recording' })
      )
      startRecording() // Host starts their own local recording
    }
  }

  const handleStopRecording = async () => {
    if (localPeer?.roleName === 'host') {
      await hmsActions.sendBroadcastMessage(
        JSON.stringify({ type: 'stop-recording' })
      )
      stopRecording() // Host stops their own local recording
    }
  }

  // Function to handle the actual end call logic (after confirmation)
  const confirmEndCall = async () => {
    setShowConfirmModal(false) // Close the modal
    try {
      if (role === 'host') {
        await hmsActions.endRoom(true, 'Host ended the call')
        navigate('/my-studios') // Navigate after host ends room
      } else {
        await hmsActions.leave()
        navigate('/') // Navigate after guest leaves
      }
    } catch (err) {
      console.error('Error ending call:', err)
      toast.error(`Error ending call: ${err.message}`, { theme: 'dark' })
    }
  }

  // Modified handleEndCall to include warning
  const handleEndCall = () => {
    if (isUploading) {
      // If uploading, show confirmation modal
      setShowConfirmModal(true)
    } else {
      // Otherwise, proceed directly
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
            isAudioMuted={!isLocalAudioEnabled} // Corrected to reflect muted state
            isVideoMuted={!isLocalVideoEnabled} // Corrected to reflect muted state
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
    </div>
  )
}

// VideoTile Component (from previous version, included for completeness)
const VideoTile = ({ peer, role, userName }) => {
  const { videoRef } = useVideo({ trackId: peer.videoTrack })
  const isVideoOff = !peer.videoTrack || peer.isVideoEnabled === false

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
            <IoMicOutline className='h-5 w-5' />
          </div>
        )}
        {!peer.isVideoEnabled && (
          <div className='bg-black/70 p-2 rounded-full text-white flex items-center justify-center'>
            <IoVideocamOutline className='h-5 w-5' />
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
