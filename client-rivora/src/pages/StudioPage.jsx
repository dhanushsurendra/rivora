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

const StudioPage = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const studioData = useSelector((state) => state.studio.studioJoinData)
  const session = useSelector((state) => state.session.session)
  const sessionToken = useSelector((state) => state.session.token)
  const localPeer = useHMSStore(selectLocalPeer)
  const peers = useHMSStore(selectPeers)
  const isConnected = useHMSStore(selectIsConnectedToRoom)
  const hmsMessages = useHMSStore(selectHMSMessages)
  const [recordingStopped, setRecordingStopped] = useState(false)
  const hasBroadcastedRef = useRef(false) 

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

  const processedMessageCountRef = useRef(0) 

  const triggerHostUpload = useCallback(async (currentSessionId) => {
    if (!currentSessionId) {
      return
    }

    if (isUploading) {
      return
    }

    try {
      toast.success('Video merging process initiated on server!', {
        theme: 'dark',
      })
      await axiosInstance.post('/session/merge-videos', {
        sessionId: currentSessionId,
      })
    } catch (error) {
      toast.error(`Failed to initiate merge: ${error.message}`, {
        theme: 'dark',
      })
    }
  }, [])

  useEffect(() => {
    if (!isConnected) {
      const joinRoom = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
          stream.getTracks().forEach((track) => track.stop())

          const token = sessionToken

          if (!token) {
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

        } catch (err) {
          toast.error(`Join failed: ${err.message}`, { theme: 'dark' })
        }
      }
      joinRoom()
    }
  }, [isConnected, hmsActions, role, userName])

  useEffect(() => {
    const newMessages = hmsMessages.slice(processedMessageCountRef.current)

    if (newMessages.length === 0) {
      return 
    }

    newMessages.forEach((latestMessage) => {
      if (localPeer?.id === latestMessage.sender) {
        return 
      }

      try {
        const data = JSON.parse(latestMessage.message)

        if (data.type === 'start-recording') {
          if (!isRecording) {
            startRecording()
            if (role === 'guest') {
              toast.info('Recording started by host.', { theme: 'dark' }) 
            }
          }
        } else if (data.type === 'stop-recording') {
          if (isRecording) {
            stopRecording()
            if (role === 'guest') {
              setRecordingStopped(true) 
            }
          } 
        } else if (data.type === 'upload-complete') {
          if (role === 'host') {
            triggerHostUpload(sessionId) 
          } 
        }
      } catch (err) {
        toast.error(
          `Failed to process message: ${latestMessage.message}`,)
      }
    })

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

  useEffect(() => {

    if (
      recordingStopped &&
      !isUploading &&
      role === 'guest' &&
      !hasBroadcastedRef.current
    ) {
      hmsActions.sendBroadcastMessage(
        JSON.stringify({ type: 'upload-complete', userName, sessionId })
      )
      hasBroadcastedRef.current = true
      setRecordingStopped(false)
      toast.success('Your recording has finished uploading!', { theme: 'dark' })
    }
  }, [isUploading, recordingStopped, role, hmsActions, userName, sessionId])

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

  useEffect(() => {
    return () => {
      if (isConnected) {
        hmsActions.leave()
      }
    }
  }, [hmsActions, isConnected])

  // Host-initiated recording actions
  const handleStartRecording = async () => {
    if (localPeer?.roleName === 'host') {
      await hmsActions.sendBroadcastMessage(
        JSON.stringify({ type: 'start-recording' })
      )
      startRecording()
    }
  }

  const handleStopRecording = async () => {
    if (localPeer?.roleName === 'host') {
      await hmsActions.sendBroadcastMessage(
        JSON.stringify({ type: 'stop-recording' })
      )
      stopRecording()
    }
  }

  // Function to handle the actual end call logic (after confirmation)
  const confirmEndCall = async () => {
    setShowConfirmModal(false)
    try {
      if (role === 'host') {
        await hmsActions.endRoom(true, 'Host ended the call')
        navigate('/my-studios')
      } else {
        await hmsActions.leave()
        navigate('/')
      }
      toast.info('Call ended.', { theme: 'dark' })
    } catch (err) {
      toast.error(`Error ending call: ${err.message}`, { theme: 'dark' })
    }
  }

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


      {/* Name and role tag - Bottom Left */}
      <div className='absolute bottom-4 left-4 text-white text-sm px-4 py-1 rounded-full bg-black/70'>
        {peer.name} ({peer.roleName}) {peer.isLocal && '(You)'}
      </div>
    </div>
  )
}

export default StudioPage
