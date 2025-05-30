import { useState } from 'react'
import Button from './Button/Button'
import ScheduleStudioDialog from './Dialog/ScheduleStudioDialog'

const Schedule = ({ canEdit, scheduledDetails, onSubmit }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isScheduled, setIsScheduled] = useState(false)

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  // This handler receives the submitted data from ScheduleStudioDialog
  const handleScheduleSubmit = ({ date, time, timezone }) => {
    // Store the submitted details
    onSubmit({ date, time, timezone })
    setIsScheduled(true)
    setIsDialogOpen(false) // Close the dialog after successful submission
  }

  const handleEditSchedule = () => {
    // When editing, open the dialog again, potentially pre-filling with current details
    setIsDialogOpen(true)
    // You might want to pass scheduledDetails to the dialog for pre-filling
    // <ScheduleStudioDialog initialDate={scheduledDetails.date} ... />
  }

  const handleRemoveSchedule = () => {
    // Reset the scheduled state
    setIsScheduled(false)
    setScheduledDetails(null)
    console.log('Schedule removed.')
  }

  // Helper function to format date for display (e.g., "Tuesday, February 28th")
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      const options = { weekday: 'long', month: 'long', day: 'numeric' }
      let formattedDate = new Intl.DateTimeFormat('en-US', options).format(date)

      // Add ordinal suffix (st, nd, rd, th) to the day
      const day = date.getDate()
      if (day > 3 && day < 21) formattedDate += 'th' // Handles 11th-19th
      else {
        switch (day % 10) {
          case 1:
            formattedDate += 'st'
            break
          case 2:
            formattedDate += 'nd'
            break
          case 3:
            formattedDate += 'rd'
            break
          default:
            formattedDate += 'th'
            break
        }
      }
      return formattedDate
    } catch (error) {
      console.error('Error formatting date:', error)
      return dateString // Return original if formatting fails
    }
  }

  // Helper function to format time for display (e.g., "5:00 P.M")
  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return ''
    try {
      // Assuming timeString is in "HH:MM" format (24-hour)
      const [hours, minutes] = timeString.split(':').map(Number)
      const date = new Date() // Use a dummy date to construct a Date object for time formatting
      date.setHours(hours, minutes)

      const options = { hour: 'numeric', minute: '2-digit', hour12: true }
      let formattedTime = new Intl.DateTimeFormat('en-US', options).format(date)

      // Ensure AM/PM is capitalized with periods
      formattedTime = formattedTime.replace('AM', 'A.M.').replace('PM', 'P.M.')
      return formattedTime
    } catch (error) {
      console.error('Error formatting time:', error)
      return timeString // Return original if formatting fails
    }
  }

  return (
    <div className='bg-[#252525] space-y-4 rounded-lg'>
      <h3 className='text-md font-medium text-white'>Schedule Studio</h3>
      <p className='text-xs text-gray-400'>
        Mark this studio as scheduled to let others know when you will be
        available.
      </p>

      {!isScheduled && (
        <Button
          text={'Schedule'}
          onClick={handleOpenDialog}
          className='hover:bg-[#6f4ed1]'
          bgColor='bg-[#8A65FD]' // Assuming your Button component allows overriding bg
          textColor='text-white' // Assuming your Button component allows overriding text color
        />
      )}

      {isScheduled && scheduledDetails && (
        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4'>
          <div className='text-gray-400 text-sm'>
            Scheduled for: {' '}
            <span className='text-green-500'>
              {formatDateForDisplay(scheduledDetails.date)},{' '}
              {formatTimeForDisplay(scheduledDetails.time)}{' '}
              {scheduledDetails.timezone}
            </span>
          </div>
          {!canEdit &&
          <div className='flex gap-2'>
            <Button
              text={'Edit'}
              onClick={handleEditSchedule}
              bgColor='bg-[#8A65FD]'
            />
            <Button
              text={'Remove'}
              onClick={handleRemoveSchedule}
              bgColor='bg-[#313131]'
              textColor='text-white'
              borderColor='border-transparent'
              className='hover:bg-gray-700'
            />
          </div>}
        </div>
      )}

      <ScheduleStudioDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleScheduleSubmit}
      />
    </div>
  )
}

export default Schedule
