import { useState, useEffect } from 'react'
import { PiRecordFill } from 'react-icons/pi'
import { useDispatch, useSelector } from 'react-redux'

const RecordButton = ({
  isRecording,
  handleStartRecording,
  handleStopRecording,
}) => {
  const [seconds, setSeconds] = useState(0)
  const role = useSelector((state) => state.studio.studioJoinData.role)
  console.log('role', role)

  useEffect(() => {
    let timer
    if (isRecording) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      setSeconds(0) // Reset seconds when not recording
    }

    return () => clearInterval(timer)
  }, [isRecording])

  const formatTime = (secs) => {
    // const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60)
    const secsLeft = secs % 60

    const pad = (num) => num.toString().padStart(2, '0')

    // return `${pad(hrs)}:${pad(mins)}:${pad(secsLeft)}`;
    return `${pad(mins)}:${pad(secsLeft)}`
  }

  return (
    <div className='flex flex-col items-center justify-center'>
      <button
        onClick={!isRecording ? handleStartRecording : handleStopRecording}
        className={`px-2 py-2 w-24 rounded-lg ${
          isRecording ? 'bg-[#252525]' : 'bg-[#EE4C4D]'
        } ${role === 'guest' ? 'cursor-not-allowed' : 'cursor-pointer'} text-white hover:bg-opacity-80 focus:outline-none flex items-center justify-center transition-colors duration-200`}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {!isRecording ? (
          <>
            <PiRecordFill className='pr-1 w-6 h-6' />
            <p className='text-md font-md'>
              {role === 'guest' ? 'Waiting' : 'Record'}
            </p>
          </>
        ) : (
          <div className='flex space-x-2 items-center'>
            <div className='w-4 h-4 rounded-md bg-[#EE4C4D]'></div>
            <span>{formatTime(seconds)}</span>
          </div>
        )}
      </button>
      <span className={`text-xs ${role === 'guest' ? 'text-transparent' : 'text-white'} mt-1 font-normal`}>
        {!isRecording ? 'Start' : 'Stop'}
      </span>
    </div>
  )
}

export default RecordButton
