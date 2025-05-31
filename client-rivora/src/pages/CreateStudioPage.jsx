import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import Button from '../components/Button/Button'
import Schedule from '../components/Schedule'
import { useDispatch, useSelector } from 'react-redux'
import { setSession, setLoading, setError } from '../redux/session/sessionSlice'
import axiosInstance from '../api/axios'

const CreateStudioPage = () => {
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [inviteeName, setInviteeName] = useState('')
  const [isInviteSent, setIsInviteSent] = useState(() => {
    const value = localStorage.getItem('isInviteSent')
    return value === 'true'
  })
  const [scheduledDetails, setScheduledDetails] = useState(null)
  const [studioName, setStudioName] = useState('')

  useEffect(() => {
    localStorage.setItem('isInviteSent', isInviteSent.toString())
  }, [isInviteSent])

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const userId = useSelector((state) => state.auth.user._id)
  const sessionId = useSelector((state) => state.session.session?._id)
  const username = useSelector((state) => state.auth.user.username)

  const handleSendInvite = async () => {
    if (!inviteeName.trim()) {
      toast.error('Please enter the guest name.', { theme: 'dark' })
      return
    }

    if (inviteeEmail.trim() !== '' && isValidEmail(inviteeEmail)) {
      if (!sessionId) {
        await createSession()
      }

      const body = {
        sessionId,
        userId,
        guestEmail: inviteeEmail,
        guestName: inviteeName.split('@')[0]
      }

      try {
        const response = await axiosInstance.post('/session/send-invitation', {
          sessionId,
          userId,
          guestEmail: inviteeEmail,
          guestName: inviteeName.split('@')[0],
        })

        toast.success(response.data.message, { theme: 'dark' })
        setIsInviteSent(true)
        setInviteeEmail('')
        setInviteeName('')
      } catch (error) {
        console.error('Error:', error)
        const msg =
          error.response?.data?.message ||
          'An error occurred while sending the invite.'
        toast.error(msg, { theme: 'dark' })
      }
    } else {
      toast.error('Please enter a valid email address.', { theme: 'dark' })
    }
  }

  const dispatch = useDispatch()
  const loading = useSelector((state) => state.session.loading)

  const handleCreateStudio = async () => {
    try {
      if (sessionId) {
        toast.error('Session is already created.', { theme: 'dark' })
        return
      }

      if (!studioName.trim()) {
        toast.error('Please enter a studio name.', { theme: 'dark' })
        return
      }

      dispatch(setLoading(true))

      const scheduledAt =
        scheduledDetails?.date && scheduledDetails?.time
          ? new Date(
              `${scheduledDetails.date}T${scheduledDetails.time}:00Z`
            ).toISOString()
          : new Date().toISOString()

      const body = {
        title: studioName,
        scheduledAt,
        host: userId,
      }

      const response = await axiosInstance.post('/session/create-session', body)

      dispatch(setSession(response.data.session))
      toast.success('Session created successfully!', { theme: 'dark' })
      return response.data
    } catch (error) {
      console.error('Error creating session:', error)
      const msg =
        error.response?.data?.message ||
        'An error occurred while creating session'
      dispatch(setError(msg))
      toast.error(msg, { theme: 'dark' })
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleScheduleSubmit = (details) => {
    setScheduledDetails(details)
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
                onChange={(e) => setStudioName(e.target.value)}
                value={studioName}
                disabled={sessionId}
              />
            </div>
          </div>
          <Schedule
            canEdit={sessionId}
            scheduledDetails={scheduledDetails}
            onSubmit={handleScheduleSubmit}
          />
        </div>

        <div className='flex'>
          <Button
            onClick={handleCreateStudio}
            text={'Create Studio'}
            isLoading={loading}
            isDisabled={sessionId}
          />
        </div>

        <div className='bg-[#252525] space-y-4 p-6 rounded-lg my-6'>
          <h3 className='text-md font-medium'>Invite Guest</h3>
          <p className='text-xs text-gray-400'>
            Invite guest to your studio by sending them an email. They will
            receive a link to join the studio.
          </p>

          <input
            type='text'
            className='rounded-lg bg-[#1E1E1E] text-white py-2 px-4 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#8A65FD] w-full sm:w-72 mb-2 mr-3'
            placeholder='Enter guest name...'
            value={inviteeName}
            disabled={isInviteSent}
            onChange={(e) => {
              setInviteeName(e.target.value)
              if (isInviteSent && e.target.value.trim() !== '') {
                setIsInviteSent(false)
              }
            }}
          />

          <Button
            text={isInviteSent ? 'Invite Sent' : 'Send Invite'}
            onClick={handleSendInvite}
            disabled={isInviteSent}
            className={`${
              isInviteSent ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#8A65FD]'
            } rounded-lg py-2 px-6 font-semibold`}
          />
        </div>
      </main>
      <ToastContainer />
    </div>
  )
}

export default CreateStudioPage
