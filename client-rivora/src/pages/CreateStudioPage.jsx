import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import Button from '../components/Button/Button'
import Schedule from '../components/Schedule'

const CreateStudioPage = () => {
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [isInviteSent, setIsInviteSent] = useState(() => {
    const value = localStorage.getItem('isInviteSent')
    return value !== null ? value : false
  })

  useEffect(() => {
    localStorage.setItem('isInviteSent', isInviteSent)
  }, [isInviteSent])

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSendInvite = () => {
    if (inviteeEmail.trim() !== '' && isValidEmail(inviteeEmail)) {
      // Simulate API call to send invite
      console.log(`Sending invite to: ${inviteeEmail}`)

      // In a real application, you'd make an actual API call here:
      // try {
      //   const response = await fetch('/api/send-invite', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ email: inviteeEmail })
      //   });
      //   if (response.ok) {
      //     toast.success(`Invite sent to ${inviteeEmail}!`);
      //     setIsInviteSent(true);
      //     setInviteeEmail(''); // Clear input after sending
      //   } else {
      //     toast.error('Failed to send invite. Please try again.');
      //   }
      // } catch (error) {
      //   console.error('Error sending invite:', error);
      //   toast.error('An error occurred while sending the invite.');
      // }

      // For demonstration:
      setTimeout(() => {
        toast.success(`Invite sent to ${inviteeEmail}!`, { theme: 'dark' })
        setIsInviteSent(true)
        setInviteeEmail('') // Clear input after sending
      }, 500)
    } else {
      toast.error('Please enter an email address to send an invite.', {
        theme: 'dark',
      })
    }
  }

  const handleCreateStudio = () => {
    window.location.href = '/device-setup'
  }

  return (
    <div className='bg-[#111111]'>
      <header className='max-w-7xl mx-auto px-4 py-6 flex items-center justify-between'>
        <h1 className='text-xl font-semibold tracking-wide text-[#8A65FD]'>
          Rivora
        </h1>
        <div className='bg-[rgba(119,79,242,0.6)] rounded-lg w-10 h-10 text-white flex items-center justify-center text-xl'>
          L
        </div>
      </header>
      <main className='max-w-7xl mx-auto px-4 py-6 bg-[#111111] min-h-screen text-white'>
        <div className='flex items-center justify-between px-1 mb-4'>
          <h1 className='text-3xl font-bold'>Create New Studio</h1>
        </div>

        <div className='bg-[#252525] rounded-lg mb-6 p-6'>
          <div className='pb-6 rounded-lg flex flex-col md:flex-row md:justify-between md:items-center'>
            <div>
              <h3 className='text-md mb-1 font-medium'>Studio Name</h3>
              <p className='text-sm text-gray-400'>
                You can always change this later.
              </p>
            </div>
            <div>
              <input
                type='text'
                className='rounded-lg bg-[#1E1E1E] text-white mt-3 md:mt-0 py-2 px-4 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#8A65FD] w-64'
                placeholder='Name your studio...'
              />
            </div>
          </div>

          <div className='rounded-lg flex flex-col md:flex-row md:justify-between md:items-center'>
            <div className='space-y-1'>
              <h3 className='text-md font-medium'>Recording Type</h3>
              <p className='text-sm text-gray-400'>
                This will only affect what gets recorded.
              </p>
              <p className='text-sm text-gray-400'>
                You can still see each other during the live call.
              </p>
            </div>
            <div className='relative w-64 mt-3 md:mt-0'>
              <select className='appearance-none rounded-lg bg-[#1E1E1E] text-white px-4 py-2 pr-10 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#8A65FD] w-full'>
                <option value='audio'>Audio Only</option>
                <option value='video'>Video & Audio</option>
              </select>

              {/* Custom Down Arrow */}
              <div className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-white'>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <Schedule />

        <div className='bg-[#252525] space-y-4 p-6 rounded-lg my-6'>
          <h3 className='text-md font-medium'>Invite Guest</h3>
          <p className='text-xs text-gray-400'>
            Invite guest to your studio by sending them an email. They will
            receive a link to join the studio.
          </p>
          <input
            type='email'
            className='rounded-lg bg-[#1E1E1E] text-white py-2 px-4 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#8A65FD] w-full sm:w-72 mr-2'
            placeholder='Enter guest email...'
            value={inviteeEmail}
            disabled={isInviteSent}
            onChange={(e) => {
              setInviteeEmail(e.target.value)
              // Re-enable button if user starts typing again after a successful send
              if (isInviteSent && e.target.value.trim() !== '') {
                setIsInviteSent(false)
              }
            }}
          />
          <Button
            text={'Send Invite'}
            onClick={handleSendInvite}
            className={`hover:bg-[#6f4ed1] ${
              isInviteSent ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            isDisabled={isInviteSent}
            bgColor='bg-[#8A65FD]'
            textColor='text-white'
          />
          <ToastContainer />
        </div>
        <Button text={'Create Studio'} onClick={handleCreateStudio} />
      </main>
    </div>
  )
}

export default CreateStudioPage