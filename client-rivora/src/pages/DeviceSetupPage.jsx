import { useState, useEffect, useRef } from 'react'
import { Mic, Video, Volume2, Headphones, X, Check } from 'lucide-react'
import { IoChevronBackSharp } from 'react-icons/io5'
import { MdKeyboardArrowDown } from 'react-icons/md'

const DeviceSetupPage = () => {
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
  const [cameraResolution, setCameraResolution] = useState(0)
  const [fps, setFps] = useState(0)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(Date.now())

  // Function to get media devices
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

      // Set default selected devices
      if (audioInput.length > 0) setSelectedMic(audioInput[0].deviceId)
      if (videoInput.length > 0) setSelectedCamera(videoInput[0].deviceId)
      if (audioOutput.length > 0) setSelectedSpeaker(audioOutput[0].deviceId)

      setMediaAccessError(null) // Clear any previous errors
    } catch (error) {
      console.error('Error accessing media devices:', error)
      setMediaAccessError(
        'Failed to access camera or microphone. Please check permissions.'
      )
    }
  }

  // Effect to get media devices on component mount
  useEffect(() => {
    getMediaDevices()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Effect to update video stream when selected camera changes
  useEffect(() => {
    const updateVideoStream = async () => {
      if (videoRef.current && selectedCamera) {
        try {
          if (stream) {
            stream.getTracks().forEach((track) => track.stop()) // Stop existing tracks
          }

          const newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
            },
            audio: {
              deviceId: selectedMic ? { exact: selectedMic } : undefined,
            },
          })
          setStream(newStream)
          videoRef.current.srcObject = newStream

          // Attempt to get actual resolution
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current && stream) {
              setCameraResolution(`${videoRef.current.videoHeight}p`)
              const videoTrack = stream.getVideoTracks()[0] // Get the active video track

              if (videoTrack) {
                const settings = videoTrack.getSettings() // Get current active settings
                // const capabilities = videoTrack.getCapabilities(); // Get capabilities (ranges of supported values)

                // Set Resolution
                if (settings.width && settings.height) {
                  setCameraResolution(`${settings.width}x${settings.height}p`)
                } else if (
                  videoRef.current.videoWidth &&
                  videoRef.current.videoHeight
                ) {
                  setCameraResolution(
                    `${videoRef.current.videoHeight}p`
                  )
                } else {
                  setCameraResolution('Unknown Resolution')
                }

                // Set FPS
                if (settings.frameRate) {
                  setFps(`${Math.round(settings.frameRate)}fps`)
                } else {
                  setFps('30')
                }
              } 
            }
          }
        } catch (error) {
          console.error('Error updating video stream:', error)
          setMediaAccessError('Could not switch camera. Please try again.')
        }
      }
    }

    updateVideoStream()
  }, [selectedCamera, selectedMic]) // Re-run when selected camera or mic changes

  // Set video stream to video element once stream is available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const handleJoinStudio = () => {
    // In a real application, this would navigate to the studio
    console.log('Joining studio with settings:', {
      userName,
      selectedMic,
      selectedCamera,
      selectedSpeaker,
      isHeadphonesUsed,
      cameraResolution,
      fps,
    })
    window.location.href = '/studio'
  }

  const measureFps = () => {
    const now = Date.now()
    frameCountRef.current++

    if (now - lastTimeRef.current >= 1000) {
      setFps(frameCountRef.current)
      frameCountRef.current = 0
      lastTimeRef.current = now
    }

    requestAnimationFrame(measureFps)
  }

  return (
    <div className='min-h-screen bg-[#1A1A1A] text-white font-inter flex flex-col items-center justify-center p-4 sm:p-6'>
      <div className='max-w-6xl w-full rounded-xl flex flex-col lg:flex-row overflow-hidden'>
        {/* Left Column */}
        <div className='flex-1 p-6 sm:p-10 flex flex-col justify-between'>
          <div>
            <div
              onClick={() => window.history.back()}
              className='flex items-center text-gray-400 mb-8 cursor-pointer'
            >
              <IoChevronBackSharp />
              <span className='text-sm ml-2'>Back</span>
            </div>

            <div className='flex items-center mb-8'>
              {/* <img src="https://placehold.co/40x40/555/fff?text=R" alt="Rivora Logo" className="h-10 w-10 mr-3 rounded-full" /> */}
              <span className='text-2xl font-bold text-gray-200'>Rivora</span>
            </div>

            <h1 className='text-3xl sm:text-4xl font-bold mb-4'>
              You're about to join Riverside Tutorial 2023
            </h1>
            <p className='text-gray-400 text-lg mb-8'>
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
                  className='w-full p-3 pl-4 pr-16 bg-[#252525] border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8A65FD] text-white'
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder='Enter your name'
                />
                <span className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 bg-gray-600 px-2 py-1 rounded-md text-xs font-semibold'>
                  Host
                </span>
              </div>
            </div>

            {/* Headphones Section */}
            <div className='mb-8'>
              <p className='text-gray-300 text-sm font-medium mb-3'>
                Are you using headphones?
              </p>
              <div className='flex space-x-3'>
                <button
                  onClick={() => setIsHeadphonesUsed(false)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                    !isHeadphonesUsed
                      ? 'bg-[#8A65FD] text-white shadow-md'
                      : 'bg-[#252525] text-gray-300 hover:bg-gray-600'
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
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                    isHeadphonesUsed
                      ? 'bg-[#8A65FD] text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
              <div className='bg-red-900 text-red-300 p-3 rounded-lg mb-4 text-sm flex items-center'>
                <X size={18} className='mr-2' />
                {mediaAccessError}
              </div>
            )}

            {/* Join Studio Button */}
            <button
              onClick={handleJoinStudio}
              className='w-full bg-[#8A65FD] hover:bg-[#8A65FD] text-white text-md font-normal py-2 rounded-lg transition-colors duration-200 text-lg shadow-lg'
            >
              Join Studio
            </button>

            <p className='text-gray-400 text-sm mt-4'>
              You are joining as a host.
            </p>
          </div>
        </div>

        {/* Right Column - Camera Feed & Device Settings */}
        <div className='flex-1 md:w-lg p-6 sm:p-10 flex flex-col bg-[#252525] rounded-xl items-center justify-center relative'>
          <div className='w-full h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden relative shadow-xl'>
            {mediaAccessError ? (
              <div className='absolute inset-0 flex items-center justify-center text-red-400 text-center p-4'>
                {mediaAccessError}
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className='w-full h-full object-cover rotate-y-180'
              ></video>
            )}
            <div className='absolute top-4 right-4 bg-black/50 bg-opacity-50 text-white text-sm px-3 py-1 rounded-full'>
              {`${cameraResolution}`}/{`${fps} fps`}
            </div>
            <div className='absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full flex items-center'>
              <span className='mr-2'>{userName}</span>
              <span className='bg-[#8A65FD] px-2 py-0.5 rounded-md text-xs font-semibold'>
                Host
              </span>
            </div>
          </div>

          {/* Device Selection Dropdowns */}
          <div className='w-full mt-8 space-y-4'>
            {/* Microphone */}
            <div className='flex items-center bg-[#252525] p-3'>
              <Mic size={20} className='text-white mr-4 flex-shrink-0' />
              <select
                value={selectedMic}
                onChange={(e) => setSelectedMic(e.target.value)}
                className='flex-grow bg-transparent text-white focus:outline-none cursor-pointer appearance-none pr-8'
              >
                {micDevices.length > 0 ? (
                  micDevices.map((device) => (
                    <option
                      key={device.deviceId}
                      value={device.deviceId}
                      className='bg-gray-700 text-white'
                    >
                      {device.label.split('(')[0]}
                    </option>
                  ))
                ) : (
                  <option className='bg-gray-700 text-gray-400'>
                    No microphones found
                  </option>
                )}
              </select>
              {/* Custom arrow for select */}
              <div className='pointer-events-none absolute right-14'>
                <MdKeyboardArrowDown />
              </div>
            </div>

            {/* Camera */}
            <div className='flex items-center bg-[#252525] p-3 relative'>
              <Video size={20} className='text-white mr-4 flex-shrink-0' />
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className='flex-grow bg-transparent text-white focus:outline-none cursor-pointer appearance-none pr-8'
              >
                {cameraDevices.length > 0 ? (
                  cameraDevices.map((device) => (
                    <option
                      key={device.deviceId}
                      value={device.deviceId}
                      className='bg-gray-700 text-white'
                    >
                      {device.label ||
                        `Camera ${device.deviceId.substring(0, 8)}...`}
                    </option>
                  ))
                ) : (
                  <option className='bg-gray-700 text-gray-400'>
                    No cameras found
                  </option>
                )}
              </select>
              {/* Custom arrow for select */}
              <div className='pointer-events-none absolute right-4'>
                <MdKeyboardArrowDown />
              </div>
            </div>

            {/* Speaker */}
            <div className='flex items-center bg-[#252525] rounded-lg p-3 relative'>
              <Volume2 size={20} className='text-white mr-4 flex-shrink-0' />
              <select
                value={selectedSpeaker}
                onChange={(e) => setSelectedSpeaker(e.target.value)}
                className='flex-grow bg-transparent text-white focus:outline-none cursor-pointer appearance-none pr-8'
              >
                {speakerDevices.length > 0 ? (
                  speakerDevices.map((device) => (
                    <option
                      key={device.deviceId}
                      value={device.deviceId}
                      className='bg-gray-700 text-white'
                    >
                      {device.label ||
                        `Speaker ${device.deviceId.substring(0, 8)}...`}
                    </option>
                  ))
                ) : (
                  <option className='bg-gray-700 text-gray-400'>
                    No speakers found
                  </option>
                )}
              </select>
              {/* Custom arrow for select */}
              <div className='pointer-events-none absolute right-4'>
                <MdKeyboardArrowDown />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeviceSetupPage
