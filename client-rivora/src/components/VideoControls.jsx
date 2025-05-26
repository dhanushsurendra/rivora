import { useState, useEffect } from 'react'

import { ImPhoneHangUp } from 'react-icons/im'
import { LuScreenShare, LuVideoOff } from 'react-icons/lu'
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2'
import { BsChat } from 'react-icons/bs'
import { IoMicOff, IoMicOutline, IoVideocamOutline } from 'react-icons/io5'
import { GoPeople } from 'react-icons/go'
import RecordButton from './Button/RecordButton'

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
  handleChatToggle,
}) => {
  return (
    <footer className='flex justify-between px-6 py-3 bg-[#111111] z-10'>
      <div className='flex items-center space-x-2'>
        {/* dummy left side */}
        <button
          className={`p-2 rounded-lg w-10 h-10 bg-gray-700 bg-transparent`}
          title='Open Chat'
        ></button>

        <button
          className={`p-2 rounded-lg
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
        <div className='flex flex-col items-center justify-center'>
          <button
            onClick={handleAudioMuteToggle}
            className={`p-2 w-10 h-10 ${
              isAudioMuted ? 'bg-red-500' : 'bg-[#252525]'
            } text-white hover:bg-opacity-80
              cursor-pointer focus:outline-none focus:ring-2 rounded-xl flex items-center justify-center transition-colors duration-200`}
            title='Toggle Audio'
          >
            {isAudioMuted ? (
              <IoMicOff className='w-6 h-6' />
            ) : (
              <IoMicOutline className='w-6 h-6' />
            )}
          </button>
          <span className='text-xs mt-1 font-normal'>Mic</span>
        </div>
        {/* Mute/Unmute Video Button */}
        <div className='flex flex-col items-center justify-center'>
          <button
            onClick={handleVideoMuteToggle}
            className={`p-2 w-10 h-10 ${
              isVideoMuted ? 'bg-red-500' : 'bg-[#252525]'
            } text-white hover:bg-opacity-80
              cursor-pointer focus:outline-none focus:ring-2 rounded-xl flex items-center justify-center transition-colors duration-200`}
            title='Toggle Video'
          >
            {isVideoMuted ? (
              <LuVideoOff className='w-6 h-6' />
            ) : (
              <IoVideocamOutline className='w-6 h-6' />
            )}
          </button>
          <span className='text-xs mt-1 font-normal'>Cam</span>
        </div>
        {/* Speaker Button */}
        <div className='relative inline-block'>
          {/* Slider above the icon */}
          {showSlider && (
            <div className='absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#1E1E1E] p-2 rounded-lg shadow-lg border border-gray-700'>
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
                }}
              />
            </div>
          )}

          {/* Speaker Button */}
          <div className='flex flex-col items-center justify-center'>
            <button
              onClick={toggleSlider}
              className={`w-10 h-10
                  bg-[#252525]
                  text-white hover:bg-opacity-80
                  cursor-pointer focus:outline-none focus:ring-2 rounded-xl flex items-center justify-center transition-colors duration-200`}
              title='Volume Control'
            >
              {volume === 0 ? (
                <HiOutlineSpeakerXMark className='w-5 h-5' />
              ) : (
                <HiOutlineSpeakerWave className='w-5 h-5' />
              )}
            </button>
            <span className='text-xs mt-1 font-normal'>Speaker</span>
          </div>
        </div>
        {/* Share Screen Button */}
        <div className='flex flex-col items-center justify-center'>
          <button
            onClick={handleShareScreenToggle}
            className={`p-1 w-10 h-10 bg-[#252525]
                text-white hover:bg-opacity-80
                cursor-pointer focus:outline-none focus:ring-2 rounded-xl flex items-center justify-center transition-colors duration-200`}
            title='Share Screen'
          >
            <LuScreenShare className='w-5 h-5' />
          </button>
          <span className='text-xs mt-1 font-normal'>Share</span>
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
        <button
          onClick={handleChatToggle}
          className={`
                p-2 rounded-lg w-10 h-10 bg-[#252525] text-white cursor-pointer focus:outline-none focus:ring-2 flex items-center justify-center transition-all duration-200`}
          title='Open Chat'
        >
          <BsChat className='w-5 h-5' />
        </button>

        {/* Audience */}
        <button
          onClick={handleChatToggle}
          className={`p-2 rounded-lg
                 w-10 h-10 bg-[#252525] text-white cursor-pointer focus:outline-none focus:ring-2 flex items-center justify-center transition-all duration-200`}
          title='Open Chat'
        >
          <GoPeople className='w-5 h-5 text-[#8A65FD]' />
        </button>
      </div>
    </footer>
  )
}

export default VideoControls
