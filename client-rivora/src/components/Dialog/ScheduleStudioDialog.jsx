import { useState } from 'react'
import Button from '../Button/Button' // Assuming your Button component exists

const ScheduleStudioDialog = ({ isOpen = true, onClose, onSubmit }) => {
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  // const timeZones = Intl.supportedValuesOf('timeZone')
  // const [selectedTimeZone, setSelectedTimeZone] = useState(
  //   Intl.DateTimeFormat().resolvedOptions().timeZone
  // )
  if (!isOpen) {
    return null
  }

  return (
    <div
      className='fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4'
      onClick={onClose}
    >
      <div
        className='bg-[#1A1A1A] rounded-xl shadow-2xl w-full max-w-md p-8 relative'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div className='flex justify-between items-center pb-4 mb-6'>
          {' '}
          {/* Added subtle border */}
          <h2 className='text-xl font-semibold text-white'>
            Schedule your studio
          </h2>
          <button
            className='text-gray-400 hover:text-white text-3xl leading-none cursor-pointer'
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit}>
          {/* Date Field */}
          <div className='mb-5 relative'>
            <label
              htmlFor='date'
              className='block text-white text-sm font-medium mb-2'
            >
              Date
            </label>
            {/* Input field with desired styling */}
            <input
              type='date' // Use type="date" for native date picker
              id='date'
              value={date} // Keep as YYYY-MM-DD for input
              onChange={(e) => setDate(e.target.value)}
              className='w-full p-3 bg-[#252525] rounded-lg text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-[#8A65FD] focus:border-[#8A65FD] appearance-none
                [color-scheme:dark]' // Helps with native picker styling in dark mode
            />
          </div>

          {/* Time Field */}
          <div className='mb-5 relative'>
            <label
              htmlFor='time'
              className='block text-white text-sm font-medium mb-2'
            >
              Time
            </label>
            <input
              type='time' // Use type="time" for native time picker
              id='time'
              value={time} // Keep as HH:MM for input
              onChange={(e) => setTime(e.target.value)}
              className='w-full p-3 bg-[#252525] rounded-lg text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-[#8A65FD] focus:border-[#8A65FD] appearance-none
                [color-scheme:dark]' // Helps with native picker styling in dark mode
            />
          </div>

          {/* Timezone Field */}
          <div className='mb-8 relative'>
            {/* <label
              htmlFor='timezone'
              className='block text-white text-sm font-medium mb-2'
            >
              Timezone <span className='text-red-500'>*</span>
            </label> */}
            {/* <select
              id='timezone'
              value={selectedTimeZone}
              onChange={(e) => setSelectedTimeZone(e.target.value)}
              className='w-full p-3 bg-[#252525] rounded-lg text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-[#8A65FD] focus:border-[#8A65FD]
                appearance-none pr-8 bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25rem_1.25rem]'
              style={{
                // Custom SVG for dropdown arrow. Changed color to match image (lighter gray)
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%239CA3AF'%3e%3cpath d='M7 8l3 3 3-3' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")`,
              }}
            >
              {timeZones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select> */}
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end gap-4 pt-6'>
            {' '}
            {/* Added subtle border */}
            {/* Cancel Button */}
            <Button
              text={'Cancel'}
              bgColor='bg-[#252525]'
              className='hover:bg-gray-700'
              onClick={onClose}
            />
            {/* Schedule Button */}
            <Button
              text={'Schedule'}
              className='hover:bg-[#6f4ed1]' // Slightly darker purple on hover
              type='submit'
              onClick={() => onSubmit({ date, time })}
            />
          </div>
        </form>
      </div>
    </div>
  )
}

export default ScheduleStudioDialog
