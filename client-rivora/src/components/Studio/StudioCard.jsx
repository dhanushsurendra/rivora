// src/components/StudioCard/StudioCard.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'

const StudioCard = ({ studio }) => {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/my-studios/${studio._id}`)
  }

  const formattedDate = new Date(studio.scheduledAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  // check if the session is happening right now
  const currentTime = new Date()
  const sessionStartTime = new Date(studio.scheduledAt)
  const sessionEndTime = new Date(sessionStartTime.getTime() + 60 * 60 * 1000 * 20)

  const isActuallyLive =
    studio.isLive ||
    (currentTime >= sessionStartTime && currentTime < sessionEndTime)
  const isScheduledForFuture = currentTime < sessionStartTime
  const isConcluded = currentTime >= sessionEndTime

  return (
    <div
      className='
        bg-[#252525] rounded-lg p-6
        cursor-pointer
        relative 
        border border-transparent transparent
        hover:bg-[#2e2e2e]
        hover:border-[#8A65FD]
        transition-all duration-300 ease-in-out
      '
      onClick={handleCardClick}
    >
      <h3 className='text-xl font-bold text-white mb-2'>{studio.title}</h3>
      <p className='text-sm text-gray-300'>Scheduled For: {formattedDate}</p>

      {/* Dynamic Status Display with more appealing colors */}
      {isActuallyLive ? (
        <div
          className='
          absolute top-4 right-4
          bg-green-600 text-white
          text-xs font-semibold px-3 py-1 rounded-full
          flex items-center gap-1
          shadow-lg shadow-green-500/20
        '
        >
          <span className='h-2 w-2 rounded-full bg-white animate-pulse-slow'></span>{' '}
          {/* White pulse dot */}
          Live
        </div>
      ) : isConcluded ? (
        <div
          className='
          absolute top-4 right-4
          bg-gray-700 text-gray-400
          text-xs font-semibold px-3 py-1 rounded-full
          border border-gray-600
        '
        >
          Ended
        </div>
      ) : isScheduledForFuture ? ( // This is essentially "Status: Scheduled"
        <div
          className='
          absolute top-4 right-4
          bg-[#8A65FD] text-white
          text-xs font-semibold px-3 py-1 rounded-full
          shadow-lg shadow-[#8A65FD]/20
        '
        >
          Upcoming
        </div>
      ) : (
        // Fallback for any other state (e.g., past but not 'isOver')
        <div
          className='
          absolute top-4 right-4
          bg-gray-700 text-gray-400
          text-xs font-semibold px-3 py-1 rounded-full
          border border-gray-600
        '
        >
          Scheduled
        </div>
      )}

      {/* Display Host Name if populated */}
      {studio.host && studio.host.name && (
        <p className='text-xs text-gray-400 mt-3'>
          Host:{' '}
          <span className='text-[#8A65FD] font-medium'>{studio.host.name}</span>
        </p>
      )}
    </div>
  )
}

export default StudioCard
