import { useEffect, useRef, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import {
  useHMSActions,
  useVideo,
  useHMSStore,
  selectPeers,
  selectIsConnectedToRoom,
  selectLocalPeer,
  selectHMSMessages,
} from '@100mslive/react-sdk'
import RightPanel from '../components/RightPanel'

import VideoControls from '../components/VideoControls'
import Header from '../components/PodcastHeader'
import { useDispatch, useSelector } from 'react-redux'

import { useAVToggle } from '@100mslive/react-sdk'

import { useLocalRecorder } from '../hooks/useLocalRecorder'

const StudioPage = () => {
  const { sessionId } = useParams()
  const location = useLocation()
  const dispatch = useDispatch()
  const session = useSelector((state) => state.session.session)
  const navigate = useNavigate()

  const localPeer = useHMSStore(selectLocalPeer)

  const { userName, role } = location.state || {
    userName: 'Guest',
    role: 'guest',
  }

  const { isRecording, startRecording, stopRecording } = useLocalRecorder(
    sessionId,
    role
  )

  const hmsActions = useHMSActions()
  const peers = useHMSStore(selectPeers)
  const isConnected = useHMSStore(selectIsConnectedToRoom)

  const [showSlider, setShowSlider] = useState(false)
  const [volume, setVolume] = useState(50)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const { isLocalAudioEnabled, isLocalVideoEnabled, toggleAudio, toggleVideo } =
    useAVToggle()

  const hmsMessages = useHMSStore(selectHMSMessages)
  const previousMessageCount = useRef(0)

  const token =
    role === 'host'
      ? import.meta.env.VITE_100MS_HOST_TOKEN
      : import.meta.env.VITE_100MS_GUEST_TOKEN

  useEffect(() => {
    if (hmsMessages.length > previousMessageCount.current) {
      const newMessages = hmsMessages.slice(previousMessageCount.current)
      previousMessageCount.current = hmsMessages.length

      newMessages.forEach((msg) => {
        try {
          const data = JSON.parse(msg.message)
          if (data.type === 'start-recording') {
            startRecording()
          } else if (data.type === 'stop-recording') {
            stopRecording()
          }
        } catch (err) {
          console.error('Invalid JSON in message:', msg.message)
        }
      })
    }
  }, [hmsMessages])

  const handleStartRecording = async () => {
    if (localPeer.roleName === 'host') {
      await hmsActions.sendBroadcastMessage(
        JSON.stringify({ type: 'start-recording' })
      )
      startRecording()
    }
  }

  const handleStopRecording = async () => {
    if (localPeer.roleName === 'host') {
      await hmsActions.sendBroadcastMessage(
        JSON.stringify({ type: 'stop-recording' })
      )
      stopRecording()
    }
  }

  useEffect(() => {
    const joinRoom = async () => {
      try {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
          console.log('Got user media permissions:', stream.getTracks())
          stream.getTracks().forEach((track) => track.stop())
        } catch (mediaError) {
          console.error('Media permissions denied:', mediaError)
          return
        }

        await hmsActions.join({
          userName,
          authToken: token,
          settings: { isAudioMuted: false, isVideoMuted: false },
        })

        console.log('Joined room successfully!')
      } catch (err) {
        console.error('Failed to join room:', err)
        toast.error(`Join failed: ${err.message}`, { theme: 'dark' })
      }
    }

    if (!isConnected) joinRoom()
  }, [isConnected])

  useEffect(() => {
    return () => {
      if (isConnected) {
        hmsActions.leave()
        console.log('Cleaned up: Left 100ms room on component unmount.')
      }
    }
  }, [hmsActions, isConnected])

  const handleEndCall = async () => {
    try {
      if (role === 'host') {
        // Host can end the room for everyone
        await hmsActions.endRoom(true, 'Host ended the call')
      } else {
        // Guests can only leave the room
        await hmsActions.leave()
      }
      navigate('/my-studios')
    } catch (err) {
      console.error('Error ending call:', err)
    }
  }

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-[#111111] text-white font-sans'>
      <div className='flex flex-1 overflow-hidden'>
        {/* Main content area and video tiles */}
        <div className='flex flex-col flex-1'>
          <Header
            title={session?.title || 'Studio'}
            participantCount={peers.length}
            userInitial={userName?.charAt(0).toUpperCase() || 'U'}
          />
          <main className='flex-1 p-4 flex flex-row items-stretch justify-center space-x-4'>
            {peers.length === 0 ? (
              <div className='flex items-center justify-center text-gray-400 text-2xl border border-dashed border-gray-600 rounded-lg w-full'>
                Connecting to session...
              </div>
            ) : peers.length === 1 ? (
              <>
                <div className='w-1/2 bg-black rounded-lg overflow-hidden shadow-xl border border-gray-700 flex items-center justify-center relative'>
                  <VideoTile peer={peers[0]} />
                </div>
                <div className='w-1/2 flex items-center justify-center text-gray-400 text-2xl border border-dashed border-gray-600 rounded-lg'>
                  Waiting for{' '}
                  {peers[0].roleName === 'host' && peers[0].isLocal
                    ? 'guest'
                    : peers[0].roleName === 'guest' && peers[0].isLocal
                    ? 'host'
                    : 'another participant'}{' '}
                  to join...
                </div>
              </>
            ) : (
              peers.slice(0, 2).map((peer) => (
                <div
                  key={peer.id}
                  className='w-1/2 bg-black rounded-lg overflow-hidden shadow-xl border border-gray-700 flex items-center justify-center relative'
                >
                  <VideoTile peer={peer} />
                </div>
              ))
            )}
          </main>

          <VideoControls
            handleStartRecording={handleStartRecording}
            handleStopRecording={handleStopRecording}
            isRecording={isRecording}
            isAudioMuted={isLocalAudioEnabled}
            isVideoMuted={isLocalVideoEnabled}
            toggleAudio={toggleAudio}
            toggleVideo={toggleVideo}
            handleEndCall={handleEndCall}
            showSlider={showSlider}
            volume={volume}
            setVolume={setVolume}
          />
        </div>

        {/* Right panel goes here, beside main content */}
        {/* <div className='w-[320px] border-l border-gray-800 h-full'>
          <RightPanel isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />
        </div> */}
      </div>
    </div>
  )
}

const VideoTile = ({ peer }) => {
  const { videoRef } = useVideo({ trackId: peer.videoTrack })

  const isVideoOff = !peer.videoTrack || peer.isVideoEnabled === false

  return (
    <div className='relative w-full h-full bg-gray-900 rounded-xl overflow-hidden'>
      <video
        ref={videoRef}
        autoPlay
        muted={peer.isLocal}
        playsInline
        className={`w-full h-full object-cover transform scale-x-[-1]`}
        onLoadedMetadata={() =>
          console.log(`Video metadata loaded for ${peer.name}`)
        }
        onCanPlay={() => console.log(`Video can play for ${peer.name}`)}
        onError={(e) => console.error(`Video error for ${peer.name}:`, e)}
      />

      {/* Placeholder if video is off */}
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
    </div>
  )
}

export default StudioPage
