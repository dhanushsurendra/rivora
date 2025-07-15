import { useState, useEffect } from 'react'
import Button from '../Button/Button' 

const ScheduleStudioDialog = ({ isOpen = true, onClose, onSubmit }) => {
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCurrentTimeString = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());

  const [minTime, setMinTime] = useState('00:00');

  useEffect(() => {
    const todayDate = getTodayDateString();
    if (date === todayDate) {
      setMinTime(getCurrentTimeString());
      if (time < getCurrentTimeString()) {
        setTime(getCurrentTimeString());
      }
    } else {
      setMinTime('00:00');
    }
  }, [date, time]); 

  if (!isOpen) {
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ date, time });
  };

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
        <form onSubmit={handleSubmit}> {/* Use the new handleSubmit */}
          {/* Date Field */}
          <div className='mb-5 relative'>
            <label
              htmlFor='date'
              className='block text-white text-sm font-medium mb-2'
            >
              Date
            </label>
            <input
              type='date'
              id='date'
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className='w-full p-3 bg-[#252525] rounded-lg text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-[#8A65FD] focus:border-[#8A65FD] appearance-none
                [color-scheme:dark]'
              min={getTodayDateString()} // Disable dates before today
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
              type='time'
              id='time'
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className='w-full p-3 bg-[#252525] rounded-lg text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-[#8A65FD] focus:border-[#8A65FD] appearance-none
                [color-scheme:dark]'
              min={minTime} // Dynamically set min time
            />
          </div>

          {/* Timezone Field (commented out as in your original code) */}
          <div className='mb-8 relative'>
            {/* ... Timezone select field (commented out) ... */}
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end gap-4 pt-6'>
            <Button
              text={'Cancel'}
              bgColor='bg-[#252525]'
              className='hover:bg-gray-700'
              onClick={onClose}
            />
            <Button
              text={'Schedule'}
              className='hover:bg-[#6f4ed1]'
              type='submit' 
            />
          </div>
        </form>
      </div>
    </div>
  )
}

export default ScheduleStudioDialog;