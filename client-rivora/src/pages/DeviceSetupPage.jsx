import { useState, useEffect, useRef } from 'react'
import { Mic, Video, Volume2, Headphones, X, Check } from 'lucide-react'
import { IoChevronBackSharp } from 'react-icons/io5'
import { MdKeyboardArrowDown } from 'react-icons/md'
import { useParams, useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { jwtDecode } from 'jwt-decode'
import { useDispatch } from 'react-redux'
import { setStudioJoinData } from '../redux/studio/studioSlice'

const DeviceSetupPage = () => {
  const navigate = useNavigate()

  const videoRef = useRef(null)
  const [userName, setUserName] = useState('')
  const [micDevices, setMicDevices] = useState([])
  const [cameraDevices, setCameraDevices] = useState([])
  const [speakerDevices, setSpeakerDevices] = useState([])
  const [selectedMic, setSelectedMic] = useState('')
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedSpeaker, setSelectedSpeaker] = useState('')
  const [isHeadphonesUsed, setIsHeadphonesUsed] = useState(false)
  const [stream, setStream] = useState(null)
  const [mediaAccessError, setMediaAccessError] = useState(null)
  const [role, setRole] = useState('')
  const [sessionId, setSessionId] = useState('')
  const dispatch = useDispatch()

  // Helper function to format device labels
  const formatDeviceLabel = (label, maxLength = 30) => {
    if (!label) return ''
    const genericCameraMatch = label.match(
      /(usb camera|webcam|integrated camera|facetime hd camera|hd camera|camera|mic|microphone|audio input) #?\d?/i
    )
    if (genericCameraMatch) {
      const genericPart = genericCameraMatch[0]
      const remaining = label.replace(genericPart, '').trim()
      if (remaining.length > 10) {
        return `${genericPart} ${remaining.substring(0, 30)}...`
      }
      return label
    }

    if (label.length > maxLength) {
      return label.substring(0, maxLength) + '...'
    }
    return label
  }

  const getAudioDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioOutput = devices.filter(
      (device) => device.kind === 'audiooutput'
    )
    setSpeakerDevices(audioOutput)
  }

  const getMediaDevices = async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      setStream(currentStream)

      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInput = devices.filter(
        (device) => device.kind === 'audioinput'
      )
      const videoInput = devices.filter(
        (device) => device.kind === 'videoinput'
      )
      const audioOutput = devices.filter(
        (device) => device.kind === 'audiooutput'
      )

      setMicDevices(audioInput)
      setCameraDevices(videoInput)
      setSpeakerDevices(audioOutput)

      if (audioInput.length > 0) setSelectedMic(audioInput[0].deviceId)
      if (videoInput.length > 0) setSelectedCamera(videoInput[0].deviceId)
      if (audioOutput.length > 0) setSelectedSpeaker(audioOutput[0].deviceId)

      setMediaAccessError(null)
    } catch (error) {
      console.error('Error accessing media devices:', error)
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError'
      ) {
        setMediaAccessError(
          'Camera/Microphone access denied. Please allow permissions in your browser settings.'
        )
        toast.error(
          'Camera/Microphone access denied. Please allow permissions in your browser settings.',
          { theme: 'dark' }
        )
      } else if (
        error.name === 'NotFoundError' ||
        error.name === 'DevicesNotFoundError'
      ) {
        setMediaAccessError(
          'No camera or microphone found. Please connect one.'
        )
        toast.error('No camera or microphone found. Please connect one.', {
          theme: 'dark',
        })
      } else {
        setMediaAccessError(
          'An unexpected error occurred while accessing devices.'
        )
        toast.error('An unexpected error occurred while accessing devices.', {
          theme: 'dark',
        })
      }
    }
  }

  useEffect(() => {
    const { sessionId, role } = jwtDecode(token)
    setSessionId(sessionId)
    setRole(role)

    getMediaDevices()
    getAudioDevices()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Effect to update video stream when selected camera or mic changes
  useEffect(() => {
    const updateVideoStream = async () => {
      if (!selectedCamera || !selectedMic) {
        return
      }

      try {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedCamera },
          },
          audio: {
            deviceId: { exact: selectedMic },
          },
        })
        setStream(newStream)
        if (videoRef.current) {
          videoRef.current.srcObject = newStream
        }

        setMediaAccessError(null)
      } catch (error) {
        console.error('Error updating video stream:', error)
        setMediaAccessError(
          'Could not switch camera/mic. Please try again or check permissions.'
        )
        toast.error(
          'Could not switch camera/mic. Please try again or check permissions.',
          { theme: 'dark' }
        )
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
        }
        setStream(null)
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
      }
    }

    if (selectedCamera && selectedMic) {
      updateVideoStream()
    }
  }, [selectedCamera, selectedMic])

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const { token } = useParams()

  const handleJoinStudio = async () => {
    if (!userName.trim()) {
      toast.error('Please enter your name.', { theme: 'dark' })
      return
    }
    if (!selectedMic) {
      toast.error('Please select a microphone.', { theme: 'dark' })
      return
    }
    if (!selectedCamera) {
      toast.error('Please select a camera.', { theme: 'dark' })
      return
    }
    if (!selectedSpeaker) {
      toast.error('Please select a speaker.', { theme: 'dark' })
      return
    }
    if (mediaAccessError) {
      toast.error(
        'Cannot join due to device access errors. Please resolve them.',
        { theme: 'dark' }
      )
      return
    }

    // Stop all media tracks and confirm shutdown
    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log(`🛑 Stopping ${track.kind} track: ${track.label}`)
        track.stop()
        track.enabled = false
        console.log(
          `${track.kind} track stopped?`,
          track.readyState === 'ended'
        )
      })
    }

    // Detach video stream safely
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
      videoRef.current.load()
    }

    // Wait a moment to ensure devices are released
    await new Promise((resolve) => setTimeout(resolve, 300))

    const studioJoinData = {
      userName,
      role,
      selectedMic,
      selectedCamera,
      selectedSpeaker,
    }

    dispatch(setStudioJoinData(studioJoinData))

    // Navigate
    navigate(`/studio/${sessionId}`)
  }

  return (
    <div className='min-h-screen bg-[#111111] text-white font-inter flex flex-col items-center justify-center p-4 sm:p-6'>
      <div className='max-w-6xl w-full rounded-xl flex flex-col lg:flex-row bg-[#1A1A1A] overflow-hidden'>
        {/* Left Column */}
        <div className='flex-1 p-6 sm:p-10 flex flex-col justify-between'>
          <div>
            {role === 'host' && (
              <div
                onClick={() => navigate(-1)}
                className='flex items-center text-gray-400 mb-8 cursor-pointer hover:text-gray-300 transition-colors duration-200'
              >
                <IoChevronBackSharp size={20} className='mr-2' />
                <span className='text-base'>Back</span>
              </div>
            )}
            <div className='flex items-center mb-8'>
              <span className='text-3xl font-bold text-gray-200'>Rivora</span>
            </div>

            <h1 className='text-3xl sm:text-4xl font-bold mb-4 leading-tight'>
              You're about to join <span className='text-[#8A65FD]'>{}</span>
            </h1>
            <p className='text-gray-400 text-base mb-8'>
              Let's check your camera and mic
            </p>

            {/* Name Input */}
            <div className='mb-6'>
              <label
                htmlFor='userName'
                className='block text-gray-300 text-sm font-medium mb-2'
              >
                Your Name
              </label>
              <div className='relative'>
                <input
                  type='text'
                  id='userName'
                  className='w-full p-3 pl-4 pr-16 bg-[#252525] border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#8A65FD] text-white placeholder-gray-500'
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder='Enter your name'
                />
                <span className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 bg-gray-700 px-3 py-1 rounded-md text-xs font-semibold'>
                  {role === 'host' ? 'Host' : 'Guest'}
                </span>
              </div>
            </div>

            {/* Headphones Section */}
            <div className='mb-8'>
              <p className='text-gray-300 text-sm font-medium mb-3'>
                Are you using headphones?
              </p>
              <div className='flex flex-wrap gap-3'>
                <button
                  onClick={() => setIsHeadphonesUsed(false)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 text-base font-semibold border border-transparent
                    ${
                      !isHeadphonesUsed
                        ? 'bg-[#8A65FD] text-white shadow-md'
                        : 'bg-[#252525] text-gray-300 hover:bg-gray-600 border-gray-700'
                    }`}
                >
                  {!isHeadphonesUsed ? (
                    <Check size={18} className='mr-2' />
                  ) : (
                    <X size={18} className='mr-2' />
                  )}
                  I am not using headphones
                </button>
                <button
                  onClick={() => setIsHeadphonesUsed(true)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 text-base font-semibold border border-transparent
                    ${
                      isHeadphonesUsed
                        ? 'bg-[#8A65FD] text-white shadow-md'
                        : 'bg-[#252525] text-gray-300 hover:bg-gray-600 border-gray-700'
                    }`}
                >
                  {isHeadphonesUsed ? (
                    <Check size={18} className='mr-2' />
                  ) : (
                    <Headphones size={18} className='mr-2' />
                  )}
                  I am using headphones
                </button>
              </div>
            </div>

            {mediaAccessError && (
              <div className='bg-red-900 text-red-300 p-4 rounded-lg mb-6 text-sm flex items-center shadow-inner'>
                <X size={20} className='mr-3' />
                {mediaAccessError}
              </div>
            )}

            {/* Join Studio Button */}
            <button
              onClick={handleJoinStudio}
              disabled={
                mediaAccessError ||
                !userName.trim() ||
                !selectedMic ||
                !selectedCamera ||
                !selectedSpeaker
              }
              className={`w-full bg-[#8A65FD] text-white text-lg font-semibold py-3 cursor-pointer rounded-lg transition-colors duration-200 shadow-lg
                ${
                  mediaAccessError ||
                  !userName.trim() ||
                  !selectedMic ||
                  !selectedCamera ||
                  !selectedSpeaker
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-[#7a55ed]'
                }`}
            >
              Join Studio
            </button>

            <p className='text-gray-400 text-sm mt-4'>
              You are joining as a {role}.
            </p>
          </div>
        </div>

        {/* Right Column - Camera Feed & Device Settings */}
        <div className='flex-1 p-6 sm:p-10 flex flex-col bg-[#1A1A1A] rounded-xl items-center justify-center relative'>
          <div className='w-full max-w-lg h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden relative shadow-xl bg-gray-800 flex items-center justify-center'>
            {mediaAccessError ? (
              <div className='absolute inset-0 flex items-center justify-center text-red-400 text-center p-4 bg-gray-900/80 rounded-xl'>
                {mediaAccessError}
              </div>
            ) : selectedCamera && stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className='w-full h-full object-cover transform rotate-y-180'
              ></video>
            ) : (
              <div className='text-gray-400 text-center'>
                No Camera Selected or Access Denied
                <Video size={48} className='mx-auto mt-4 text-gray-600' />
              </div>
            )}
            {selectedCamera && stream && (
              <>
                <div className='absolute bottom-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full flex items-center'>
                  <span className='mr-2'>{userName || 'Your Name'}</span>
                  <span className='bg-[#8A65FD] px-2 py-0.5 rounded-md text-xs font-semibold'>
                    {role === 'host' ? 'Host' : 'Guest'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Device Selection Dropdowns */}
          <div className='w-full mt-8 space-y-4'>
            <div className='flex items-center bg-[#1E1E1E] rounded-lg p-3 border border-gray-700'>
              <Mic size={20} className='text-white mr-4 flex-shrink-0' />
              <select
                value={selectedMic}
                onChange={(e) => setSelectedMic(e.target.value)}
                className='flex-grow min-w-0 bg-transparent text-white focus:outline-none cursor-pointer appearance-none pr-3 text-base overflow-hidden whitespace-nowrap text-ellipsis'
                title={
                  micDevices.find((d) => d.deviceId === selectedMic)?.label ||
                  'No microphone selected'
                }
              >
                {micDevices.length > 0 ? (
                  micDevices.map((device) => (
                    <option
                      key={device.deviceId}
                      value={device.deviceId}
                      className='bg-gray-800 text-white'
                      title={device.label}
                    >
                      {formatDeviceLabel(
                        device.label ||
                          `Microphone ${device.deviceId.substring(0, 8)}`,
                        50
                      )}
                    </option>
                  ))
                ) : (
                  <option className='bg-gray-800 text-gray-400'>
                    No microphones found
                  </option>
                )}
              </select>
              <div className='flex-shrink-0 text-gray-400 ml-2'>
                <MdKeyboardArrowDown size={20} />
              </div>
            </div>

            {/* Camera */}

            <div className='flex items-center bg-[#1E1E1E] rounded-lg p-3 border border-gray-700'>
              <Video size={20} className='text-white mr-4 flex-shrink-0' />
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className='flex-grow min-w-0 bg-transparent text-white focus:outline-none cursor-pointer appearance-none pr-3 text-base overflow-hidden whitespace-nowrap text-ellipsis'
                title={
                  cameraDevices.find((d) => d.deviceId === selectedCamera)
                    ?.label || 'No camera selected'
                }
              >
                {cameraDevices.length > 0 ? (
                  cameraDevices.map((device) => (
                    <option
                      key={device.deviceId}
                      value={device.deviceId}
                      className='bg-gray-800 text-white' // No text-ellipsis here
                      title={device.label}
                    >
                      {formatDeviceLabel(
                        device.label ||
                          `Camera ${device.deviceId.substring(0, 50)}`,
                        50
                      )}
                    </option>
                  ))
                ) : (
                  <option className='bg-gray-800 text-gray-400'>
                    No cameras found
                  </option>
                )}
              </select>
              <div className='flex-shrink-0 text-gray-400 ml-2'>
                <MdKeyboardArrowDown size={20} />
              </div>
            </div>
            {/* Speaker */}
            <div className='flex items-center bg-[#1E1E1E] rounded-lg p-3 border border-gray-700'>
              <Volume2 size={20} className='text-white mr-4 flex-shrink-0' />
              <select
                value={selectedSpeaker}
                onChange={(e) => setSelectedSpeaker(e.target.value)}
                className='flex-grow min-w-0 bg-transparent text-white focus:outline-none cursor-pointer appearance-none pr-3 text-base overflow-hidden whitespace-nowrap text-ellipsis'
                title={
                  speakerDevices.find((d) => d.deviceId === selectedSpeaker)
                    ?.label || 'No speaker selected'
                }
              >
                {speakerDevices.length > 0 ? (
                  speakerDevices.map((device) => (
                    <option
                      key={device.deviceId}
                      value={device.deviceId}
                      className='bg-gray-800 text-white' // No text-ellipsis here
                      title={device.label}
                    >
                      {formatDeviceLabel(
                        device.label ||
                          `Speaker ${device.deviceId.substring(0, 50)}`,
                        50
                      )}
                    </option>
                  ))
                ) : (
                  <option className='bg-gray-800 text-gray-400'>
                    No speakers found
                  </option>
                )}
              </select>
              <div className='flex-shrink-0 text-gray-400 ml-2'>
                <MdKeyboardArrowDown size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer
        position='bottom-right'
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='dark'
      />
    </div>
  )
}

export default DeviceSetupPage
