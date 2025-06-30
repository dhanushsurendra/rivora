import { useState, useEffect } from 'react'

import { ImPhoneHangUp } from 'react-icons/im'
import { LuScreenShare, LuVideoOff } from 'react-icons/lu'
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2'
import { IoMicOff, IoMicOutline, IoVideocamOutline } from 'react-icons/io5'
import { GoPeople } from 'react-icons/go'
import RecordButton from './Button/RecordButton'
import VideoControlButton from './Button/VideoControlButton'
import ChatToggleButton from './Chat/ChatToggleButton'

import { useAVToggle } from "@100mslive/react-sdk";

const VideoControls = ({
  isRecording,
  isAudioMuted,
  isVideoMuted,
  showSlider,
  volume,
  handleStartRecording,
  handleStopRecording,
  setVolume,
  toggleSlider,
  handleAudioMuteToggle,
  handleVideoMuteToggle,
  handleShareScreenToggle,
  handleEndCall,
}) => {

  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false)

  const handleChatToggle = () => {
    setIsChatWindowOpen(!isChatWindowOpen)
  }

  const {
    isLocalAudioEnabled,
    isLocalVideoEnabled,
    toggleAudio,
    toggleVideo
  } = useAVToggle();

  return (
    <footer className='flex justify-between px-6 py-3 bg-[#111111] z-10'>
      <div className='flex items-center space-x-2'>
        {/* dummy left side */}
        <button
          className={`p-2 rounded-lg w-10 h-10 bg-transparent`}
          title='Open Chat'
        ></button>

        <button
          className={`
                p-2 rounded-md w-10 h-10 bg-transparent`}
          title='Open Chat'
        ></button>
      </div>

      <div className='flex items-center space-x-2'>
        <RecordButton
          isRecording={isRecording}
          handleStartRecording={handleStartRecording}
          handleStopRecording={handleStopRecording}
        />
        {/* Mute/Unmute Audio Button */}
        <VideoControlButton
          iconOn={<IoMicOff className='w-6 h-6' />}
          iconOff={<IoMicOutline className='w-6 h-6' />}
          label='Mic'
          title='Toggle Audio'
          onClick={toggleAudio}
          isToggled={!isLocalAudioEnabled}
        />

        {/* Mute/Unmute Video But ton */}
        <VideoControlButton
          iconOn={<LuVideoOff className='w-6 h-6' />}
          iconOff={<IoVideocamOutline className='w-6 h-6' />}
          label='Cam'
          title='Toggle Video'
          onClick={toggleVideo}
          isToggled={!isLocalVideoEnabled}
        />

        {/* Speaker Button */}
        <div className='relative inline-block'>
          {/* Slider above the icon */}
          {showSlider && (
            <div className='absolute bottom-18 left-1/2 -translate-x-1/2 bg-[#1E1E1E] p-2 rounded-lg shadow-lg border border-gray-700'>
              <input
                type='range'
                min='0'
                max='100'
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className='range-slider'
                orient='vertical'
                style={{
                  writingMode: 'bt-lr',
                  WebkitAppearance: 'slider-vertical',
                  height: '100px',
                  width: '8px',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              />
            </div>
          )}

          {/* Speaker Button */}
          <VideoControlButton
            iconOn={<HiOutlineSpeakerWave className='w-5 h-5' />}
            iconOff={<HiOutlineSpeakerXMark className='w-5 h-5' />}
            label='Speaker'
            title='Volume Control'
            onClick={toggleSlider}
            bgColor='bg-[#252525]'
            isToggled={!(volume === 0)}
          />
        </div>
        
        {/* End Call Button */}
        <div className='flex flex-col items-center justify-center'>
          <button
            onClick={handleEndCall}
            className='p-2 rounded-xl w-10 h-10 bg-[#271E1D] text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 flex items-center justify-center transition-all duration-200'
            title='End Call'
          >
            <ImPhoneHangUp className='text-[#EE4C4D] w-5 h-5' />
          </button>
          <span className='text-xs mt-1 font-normal'>Leave</span>
        </div>
      </div>

      <div className='flex items-center space-x-2'>
        {/* Chat Button */}
        <ChatToggleButton isOpen={isChatWindowOpen} handleChatToggle={handleChatToggle} />
      </div>
    </footer>
  )
}

export default VideoControls
