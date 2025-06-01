import { useRef, useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Peer from 'simple-peer'
import io from 'socket.io-client'

import RightPanel from '../components/RightPanel'
import VideoControls from '../components/VideoControls'
import Header from '../components/PodcastHeader'
import UserVideos from '../components/UserVideos'
import { useDispatch, useSelector } from 'react-redux'
import { setError, setLoading, setSession } from '../redux/session/sessionSlice'
import axiosInstance from '../api/axios'
import { MoonLoader } from 'react-spinners'
import { toast } from 'react-toastify'
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

const StudioPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [stream, setStream] = useState(null) // Stores the local media stream
  const [otherUserId, setOtherUserId] = useState(null) // Stores the ID of the other connected user
  const [roomFull, setRoomFull] = useState(false) // State to indicate if the room is full
  const [permissionDenied, setPermissionDenied] = useState(false) // State for permission issues
  const [sessionId, setSessionId] = useState('')

  // UI States for buttons (no functional implementation in this code)
  const [isRecording, setIsRecording] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isShareScreenActive, setIsShareScreenActive] = useState(false) // Placeholder
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

          // Ensure the video element is ready before playing and set the volume
          peerVideo.current.onloadedmetadata = () => {
            peerVideo.current.volume = volume / 100
            peerVideo.current.play()
            console.log('[Metadata] Volume set and playback started')
          }
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
  const fetchSessionDetails = async () => {
    setSessionId('')
    if (!sessionId) {
      console.warn(
        'No sessionId found in URL params. Cannot fetch studio details.'
      )
      toast.error('Session ID is missing. Cannot load studio details.', {
        theme: 'dark',
      })
      navigate('/my-studios') // Redirect if sessionId is missing
      return
    }

    dispatch(setLoading(true)) // Set loading state in Redux
    try {
      console.log('here')
      // Make the API call to your backend
      // Adjust the endpoint if it's different
      const response = await axiosInstance.get(`/session/${sessionId}`)
      console.log(response)

      if (response.data && response.data.session) {
        dispatch(setSession(response.data.session)) // Store session in Redux
        // Optionally, if the backend sends a default user name or specific host name, you can set it here
        // setUserName(response.data.session.defaultUserName || '');
      } else {
        // If response doesn't contain expected data, throw an error
        throw new Error('Invalid session data received from backend.')
      }
    } catch (error) {
      console.error('Error fetching session details:', error)
      const msg =
        error.response?.data?.message ||
        'Failed to load studio details. Please check your connection or try again later.'
      dispatch(setError(msg)) // Set error state in Redux
      navigate('/my-studios') // Redirect on API error
    } finally {
      dispatch(setLoading(false)) // Always clear loading state
    }
  }

  // Effect to get user media (camera and microphone access)
  useEffect(() => {
    let currentMediaStream = null // To hold the stream locally for this effect's scope

    const setupMediaAndSession = async () => {
      try {
        // 1. Fetch session details (await this)
        await fetchSessionDetails()
        console.log(
          '[useEffect-setupMediaAndSession] Session details fetched successfully.'
        )

        // 2. Get user media
        currentMediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        setStream(currentMediaStream) // Update state
        setPermissionDenied(false)

        if (userVideo.current) {
          console.log('Muted:', userVideo.current.muted)
          userVideo.current.srcObject = currentMediaStream
        }
        console.log(
          "[useEffect-setupMediaAndSession] Got user media successfully. Emitting 'join-room'."
        )
        socket.emit('join-room')
      } catch (err) {
        console.error(
          '[useEffect-setupMediaAndSession] Error during setup:',
          err
        )
        setPermissionDenied(true)
        // Only call cleanupCall if you want to explicitly clean up connections/peers
        // right after a media error. Be careful not to double-cleanup.
        // cleanupCall(); // Uncomment if cleanupCall handles only error state cleanup

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
      }
    }

    // Call the async function
    setupMediaAndSession()

    // Cleanup function: This runs when the component unmounts or dependencies change
    return () => {
      console.log(
        '[useEffect-cleanup] Component unmounting or effect re-running. Cleaning up local stream.'
      )
      // Use the local 'currentMediaStream' if it was successfully set up in this effect run
      // This is safer than relying on 'stream' from state, which might be updated by other effects
      if (currentMediaStream) {
        console.log(
          'Cleaning up tracks from currentMediaStream:',
          currentMediaStream
        )
        currentMediaStream.getTracks().forEach((track) => track.stop())
        // setStream(null); // You might not need to set state here if component is unmounting
      } else if (stream) {
        // Fallback to state stream if local was not set
        console.log('Cleaning up tracks from state stream:', stream)
        stream.getTracks().forEach((track) => track.stop())
        // setStream(null);
      } else {
        console.log('No stream found for cleanup.')
      }
      // If cleanupCall() destroys other things like peers, call it here:
      // cleanupCall();
    }
  }, [sessionId, dispatch, navigate])

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

  useEffect(() => {
    if (peerVideo.current) {
      peerVideo.current.volume = volume / 100
    }
    console.log(`[Volume Test] Volume set to ${volume / 100}`)
  }, [volume])

  const session = useSelector((state) => state.session.session)
  const loading = useSelector((state) => state.session.loading)
  const user = useSelector((state) => state.auth.user)

  const startRecording = () => {
    if (!stream) {
      console.warn('[startRecording] No stream available to record.')
      return
    }

    recordedChunks.current = [] // Initialize/reset before recording

    recordedRef.current = new MediaRecorder(stream)

    recordedRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log('Received data chunk')
        recordedChunks.current.push(event.data)
      }
    }

    recordedRef.current.onstart = () => {
      console.log('Recording started')
      setIsRecording(true)
    }

    recordedRef.current.start() // <== start the recorder
  }

  const stopRecording = () => {
    if (recordedRef.current?.state === 'recording') {
      recordedRef.current.stop()
      setIsRecording(false)

      setTimeout(() => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'recording.webm'
        window.open(url)
        recordedChunks.current = []
      }, 1000)
    }
  }

  const toggleSlider = () => setShowSlider((prev) => !prev)

  const handleAudioMuteToggle = () => {
    if (!stream) {
      console.warn('[handleAudioMuteToggle] No stream available to mute audio.')
      return
    }

    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) {
      console.warn('[handleAudioMuteToggle] No audio tracks found.')
      return
    }

    // Toggle enabled state
    const newMutedState = !isAudioMuted
    audioTracks.forEach((track) => {
      track.enabled = !newMutedState
    })
    setIsAudioMuted(newMutedState)
  }

  const handleVideoMuteToggle = () => {
    if (!stream) {
      console.warn('[handleVideoMuteToggle] No stream available to mute video.')
      return
    }

    const videoTracks = stream.getVideoTracks()
    if (videoTracks.length === 0) {
      console.warn('[handleVideoMuteToggle] No video tracks found.')
      return
    }

    // Toggle enabled state
    const newMutedState = !isVideoMuted
    videoTracks.forEach((track) => {
      track.enabled = !newMutedState
    })
    setIsVideoMuted(newMutedState)
  }

  const handleShareScreenToggle = () => {
    setIsShareScreenActive((prev) => !prev)
    console.log('Share screen toggled (UI only):', !isShareScreenActive)
  }

  const handleEndCall = () => {
    console.log('Attempting to end call (UI only).')
    socket.emit('leave-room') // Inform the server that we are leaving
    cleanupCall() // Perform full cleanup
  }

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-[#111111] text-white font-sans'>
      {/* Main Content Area: Two Columns */}
      {loading ? (
        <div className='bg-[#1A1A1A] min-h-screen flex flex=col items-center justify-center text-white'>
          <MoonLoader color='#8A65FD' size={60} />
          <h3 className='text-md font-semibold mt-4'>Loading Studio</h3>
        </div>
      ) : (
        <div className='flex flex-1 overflow-hidden bg-[#111111]'>
          {/* Left Column: Video Feeds and Controls */}
          <div className='flex flex-col flex-1'>
            <Header
              title={session.title}
              participantCount={2}
              userInitial={user.name.substring(0, 1).toUpperCase()} // This could be dynamic based on user login
            />

            <div className='flex flex-col flex-1'>
              <UserVideos
                roomFull={roomFull}
                permissionDenied={permissionDenied}
                stream={stream}
                userVideo={userVideo}
                peerVideo={peerVideo}
                otherUserId={otherUserId}
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
                handleShareScreenToggle={handleShareScreenToggle}
                handleEndCall={handleEndCall}
              />
            </div>
          </div>

          <RightPanel />
        </div>
      )}
    </div>
  )
}

export default StudioPage
