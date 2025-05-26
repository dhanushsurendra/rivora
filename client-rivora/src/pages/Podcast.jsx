import { useRef, useEffect, useState, useCallback } from 'react'
import Peer from 'simple-peer'
import io from 'socket.io-client'

import RightPanel from '../components/RightPanel'
import VideoControls from '../components/VideoControls'
import Header from '../components/PodcastHeader'
import UserVideos from '../components/UserVideos'

// Socket connection should be outside the component to avoid re-creating on re-renders
// IMPORTANT: Replace "http://localhost:5000" with your computer's local IP address
// if testing on different devices (e.g., "http://192.168.1.100:5000")
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
})

// Define STUN servers for WebRTC NAT traversal
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // Add TURN servers here if STUN is not sufficient for your network
  // { urls: 'turn:YOUR_TURN_SERVER_IP:PORT', username: 'YOUR_USERNAME', credential: 'YOUR_PASSWORD' }
]

function Podcast() {
  const [stream, setStream] = useState(null) // Stores the local media stream
  const [otherUserId, setOtherUserId] = useState(null) // Stores the ID of the other connected user
  const [roomFull, setRoomFull] = useState(false) // State to indicate if the room is full
  const [permissionDenied, setPermissionDenied] = useState(false) // State for permission issues

  const [showDialog, setShowDialog] = useState(false)
  const [email, setEmail] = useState('')

  // UI States for buttons (no functional implementation in this code)
  const [isRecording, setIsRecording] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isShareScreenActive, setIsShareScreenActive] = useState(false) // Placeholder
  const [isChatOpen, setIsChatOpen] = useState(false) // Placeholder
  const [showSlider, setShowSlider] = useState(false)
  const [volume, setVolume] = useState(50)

  const userVideo = useRef() // Reference to the video element for the local stream
  const peerVideo = useRef() // Reference to the video element for the remote stream
  const peerRef = useRef() // Stores the simple-peer instance for the WebRTC connection
  const recordedRef = useRef(null)
  const recordedChunks = useRef([])

  // Function to clean up the peer connection and stream
  const cleanupCall = useCallback(() => {
    console.log('[cleanupCall] Cleaning up peer and stream.')
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setOtherUserId(null)
    setRoomFull(false)
    setPermissionDenied(false)
    // Reset UI states for buttons as well
    setIsRecording(false)
    setIsAudioMuted(false)
    setIsVideoMuted(false)
    setIsShareScreenActive(false)
    setIsChatOpen(false)
  }, [stream])

  // Function to create a new peer connection as the initiator
  const createPeer = useCallback(
    (userToSignal, callerId, currentStream) => {
      if (!currentStream) {
        console.warn(
          '[createPeer] Cannot create peer: currentStream is null or undefined.'
        )
        return null
      }
      console.log(
        `[createPeer] Creating peer as initiator to signal ${userToSignal} with stream:`,
        currentStream
      )
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: currentStream,
        iceServers: iceServers,
      })

      peer.on('signal', (signal) => {
        console.log(
          "[createPeer] Emitting 'signal' (initiator) to server. Signal type:",
          signal.type
        )
        socket.emit('signal', { userToSignal, signal, from: callerId })
      })

      peer.on('stream', (remoteStream) => {
        console.log('[createPeer] Received remote stream (initiator side).')
        if (peerVideo.current) {
          peerVideo.current.srcObject = remoteStream
        }
      })

      peer.on('close', () => {
        console.log('[createPeer] Peer connection closed (initiator side).')
        setOtherUserId(null)
        if (peerRef.current) {
          peerRef.current = null
        }
      })

      peer.on('error', (err) => {
        console.error('[createPeer] Peer error (initiator):', err)
        cleanupCall()
      })

      return peer
    },
    [cleanupCall]
  )

  // Function to add a peer connection as the receiver
  const addPeer = useCallback(
    (incomingSignal, currentStream, fromId) => {
      if (!currentStream) {
        console.warn(
          '[addPeer] Cannot add peer: currentStream is null or undefined.'
        )
        return null
      }
      console.log(
        `[addPeer] Adding peer as receiver from ${fromId} with stream:`,
        currentStream
      )
      console.log(
        `[addPeer] Incoming signal type for receiver: ${
          incomingSignal.type || 'unknown'
        }`
      )

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: currentStream,
        iceServers: iceServers,
      })

      peer.on('signal', (signal) => {
        console.log(
          "[addPeer] Emitting 'signal' (receiver) to server. Signal type:",
          signal.type
        )
        socket.emit('signal', { userToSignal: fromId, signal, from: socket.id })
      })

      peer.on('stream', (remoteStream) => {
        console.log('[addPeer] Received remote stream (receiver side).')
        if (peerVideo.current) {
          peerVideo.current.srcObject = remoteStream
        }
      })

      peer.on('close', () => {
        console.log('[addPeer] Peer connection closed (receiver side).')
        setOtherUserId(null)
        if (peerRef.current) {
          peerRef.current = null
        }
      })

      peer.on('error', (err) => {
        console.error('[addPeer] Peer error (receiver):', err)
        cleanupCall()
      })

      try {
        console.log(
          `[addPeer] Calling peer.signal() with type: ${incomingSignal.type}`
        )
        peer.signal(incomingSignal)
      } catch (e) {
        console.error('[addPeer] Error during peer.signal():', e)
        cleanupCall()
      }

      return peer
    },
    [cleanupCall]
  )

  // Effect to get user media (camera and microphone access)
  useEffect(() => {
    console.log('[useEffect-getUserMedia] Requesting user media...')
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream)
        setPermissionDenied(false)
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream
        }
        console.log(
          "[useEffect-getUserMedia] Got user media successfully. Emitting 'join-room'."
        )
        socket.emit('join-room')
      })
      .catch((err) => {
        console.error('[useEffect-getUserMedia] Failed to get media:', err)
        setPermissionDenied(true)
        cleanupCall()
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError'
        ) {
          alert(
            'Permission to access camera/microphone denied. Please allow it in your browser settings.'
          )
        } else if (err.name === 'NotFoundError') {
          alert(
            'No camera or microphone found. Please ensure devices are connected.'
          )
        } else {
          alert(
            'An error occurred while accessing media devices: ' + err.message
          )
        }
      })

    return () => {
      console.log(
        '[useEffect-getUserMedia] Component unmounting or effect re-running. Cleaning up local stream.'
      )
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }
    }
  }, [])

  // Effect for clearing video elements' srcObject when peers are destroyed/stream is null
  useEffect(() => {
    const localVideoElement = userVideo.current
    const remoteVideoElement = peerVideo.current

    if (localVideoElement && !stream) {
      localVideoElement.srcObject = null
    }

    if (remoteVideoElement && (!otherUserId || !peerRef.current)) {
      remoteVideoElement.srcObject = null
    }
  }, [stream, otherUserId, peerRef.current])

  // Effect for Socket.IO event listeners and managing peer connection state
  useEffect(() => {
    console.log('[useEffect-socket] Setting up socket listeners.')

    const onConnect = () => {
      console.log('[socket.on.connect] Socket connected with id:', socket.id)
      if (stream && !roomFull) {
        socket.emit('join-room')
        console.log(
          "[socket.on.connect] Re-emitted 'join-room' as stream is active."
        )
      }
    }

    const onConnectError = (err) => {
      console.error('[socket.on.connect_error] Connection error:', err)
      alert(
        'Could not connect to the signaling server. Please ensure the server is running.'
      )
      cleanupCall()
    }

    const onOtherUser = (userId) => {
      console.log("[socket.on.other-user] Received 'other-user':", userId)
      setOtherUserId(userId)
      if (stream && !peerRef.current && socket.id < userId) {
        console.log(
          `[socket.on.other-user] Initiating peer with ${userId} because my ID (${socket.id}) is smaller.`
        )
        peerRef.current = createPeer(userId, socket.id, stream)
      } else if (!stream) {
        console.warn(
          "[socket.on.other-user] Postponing peer creation for 'other-user': Local stream not yet available."
        )
      }
    }

    const onUserJoined = (userId) => {
      console.log("[socket.on.user-joined] Received 'user-joined':", userId)
      setOtherUserId(userId)
      if (stream && !peerRef.current && socket.id < userId) {
        console.log(
          `[socket.on.user-joined] Initiating peer with ${userId} because my ID (${socket.id}) is smaller.`
        )
        peerRef.current = createPeer(userId, socket.id, stream)
      } else if (!stream) {
        console.warn(
          "[socket.on.user-joined] Postponing peer creation for 'user-joined': Local stream not yet available."
        )
      }
    }

    const onRoomFull = () => {
      console.warn('[socket.on.room-full] Room is full. Cannot join.')
      setRoomFull(true)
      cleanupCall()
      alert(
        'The video call room is currently full (2 users). Please try again later.'
      )
    }

    const onSignal = ({ signal, from }) => {
      console.log(
        `[socket.on.signal] Received 'signal' from: ${from}. Signal type: ${
          signal.type || 'unknown'
        }`
      )
      if (from === socket.id) {
        console.log('[socket.on.signal] Ignoring signal from self.')
        return
      }

      if (!peerRef.current) {
        if (signal.type === 'offer' && stream) {
          console.log(
            '[socket.on.signal] Creating new peer as receiver based on incoming OFFER.'
          )
          peerRef.current = addPeer(signal, stream, from)
        } else {
          console.warn(
            '[socket.on.signal] Ignoring signal. No peer exists, not an offer to initiate, or stream not ready.'
          )
          return
        }
      } else {
        console.log(
          '[socket.on.signal] Signaling existing peer with incoming signal.'
        )
        try {
          peerRef.current.signal(signal)
        } catch (e) {
          console.error('[socket.on.signal] Error signaling existing peer:', e)
        }
      }
    }

    const onDisconnect = (reason) => {
      console.warn('[socket.on.disconnect] Socket disconnected:', reason)
      if (!roomFull) {
        alert('Disconnected from the signaling server.')
      }
      cleanupCall()
    }

    socket.on('connect', onConnect)
    socket.on('connect_error', onConnectError)
    socket.on('other-user', onOtherUser)
    socket.on('user-joined', onUserJoined)
    socket.on('room-full', onRoomFull)
    socket.on('signal', onSignal)
    socket.on('disconnect', onDisconnect)

    return () => {
      console.log('[useEffect-socket] Cleaning up socket listeners.')
      socket.off('connect', onConnect)
      socket.off('connect_error', onConnectError)
      socket.off('other-user', onOtherUser)
      socket.off('user-joined', onUserJoined)
      socket.off('room-full', onRoomFull)
      socket.off('signal', onSignal)
      socket.off('disconnect', onDisconnect)
    }
  }, [stream, createPeer, addPeer, cleanupCall, socket.id, roomFull])

  const startRecording = () => {
    // if (!stream) {
    //   console.warn('[startRecording] No stream available to record.')
    //   return
    // }

    // recordedRef.current = new MediaRecorder(stream)
    // recordedRef.current.ondataavailable = (event) => {
    //   if (event.data.size > 0) {
    //     recordedChunks.current.push(event.data)
    //   }
    //   recordedChunks.current.start()
    //   setIsRecording(true)
    // }
  }

  const stopRecording = () => {
    // if (recordedRef.current?.state === 'recording') {
    //   recordedRef.current.stop()
    //   setIsRecording(false)
      
    //   setTimeout(() => {
    //     const blob = new Blob(recordedChunks.current, { type: 'video/webm' })
    //     const url = URL.createObjectURL(blob)
    //     const a = document.createElement('a')
    //     a.href = url
    //     a.download = 'recording.webm'
    //     recordedChunks.current = [] 
    //   }, 1000)
    // }
  }

  const toggleSlider = () => setShowSlider((prev) => !prev)

  // Placeholder functions for UI buttons (no actual WebRTC logic here)
  const handleRecordToggle = () => {
    setIsRecording((prev) => !prev)
    console.log('Record toggled (UI only):', !isRecording)
  }

  const handleAudioMuteToggle = () => {
    setIsAudioMuted((prev) => !prev)
    console.log('Audio mute toggled (UI only):', !isAudioMuted)
  }

  const handleVideoMuteToggle = () => {
    setIsVideoMuted((prev) => !prev)
    console.log('Video mute toggled (UI only):', !isVideoMuted)
  }

  const handleShareScreenToggle = () => {
    setIsShareScreenActive((prev) => !prev)
    console.log('Share screen toggled (UI only):', !isShareScreenActive)
  }

  const handleChatToggle = () => {
    setIsChatOpen((prev) => !prev)
    console.log('Chat toggled (UI only):', !isChatOpen)
  }

  const handleInviteClick = () => {
    setShowDialog(true)
  }

  const handleAudioToggle = () => {
    setIsChatOpen((prev) => !prev)
    console.log('Chat toggled (UI only):', !isChatOpen)
  }

  const handleEndCall = () => {
    console.log('Attempting to end call (UI only).')
    socket.emit('leave-room') // Inform the server that we are leaving
    cleanupCall() // Perform full cleanup
  }

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-[#111111] text-white font-sans'>
      {/* Main Content Area: Two Columns */}

      <div className='flex flex-1 overflow-hidden bg-[#111111]'>
        {/* Left Column: Video Feeds and Controls */}
        <div className='flex flex-col flex-1'>
          <Header
            participantCount={2}
            onInviteClick={handleInviteClick}
            userInitial='L' // This could be dynamic based on user login
          />

          <div className='flex flex-col flex-1'>
            <UserVideos
              roomFull={roomFull}
              permissionDenied={permissionDenied}
              stream={stream}
              userVideo={userVideo}
              peerVideo={peerVideo}
              otherUserId={otherUserId}
              showDialog={showDialog}
              setShowDialog={setShowDialog}
            />
            {/* Bottom Control Bar */}
            <VideoControls
              isRecording={isRecording}
              isAudioMuted={isAudioMuted}
              isVideoMuted={isVideoMuted}
              showSlider={showSlider}
              volume={volume}
              handleStartRecording={startRecording}
              handleStopRecording={stopRecording}
              setVolume={setVolume}
              toggleSlider={toggleSlider}
              handleAudioMuteToggle={handleAudioMuteToggle}
              handleVideoMuteToggle={handleVideoMuteToggle}
              handleRecordToggle={handleRecordToggle}
              handleShareScreenToggle={handleShareScreenToggle}
              handleEndCall={handleEndCall}
              handleChatToggle={handleChatToggle}
            />
          </div>
        </div>

        <RightPanel />
      </div>
    </div>
  )
}

export default Podcast
