import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import Button from '../components/Button/Button';
import Schedule from '../components/Schedule';
import { useDispatch, useSelector } from 'react-redux';
import {
  setSession,
  setLoading,
  setError,
} from '../redux/session/sessionSlice';
import axiosInstance from '../api/axios';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const CreateStudioPage = () => {
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [isInviteSent, setIsInviteSent] = useState(false);
  const [scheduledDetails, setScheduledDetails] = useState(null);
  const [studioName, setStudioName] = useState('');
  const [hasCurrentStudioBeenCreated, setHasCurrentStudioBeenCreated] = useState(false)
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // --- Redux Selectors ---
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.session.loading); // Redux loading for Create Studio
  const userId = useSelector((state) => state.auth.user._id);
  const session = useSelector((state) => state.session.session); // Get the whole session object
  const sessionId = session?._id; 

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendInvite = async () => {
    if (!sessionId) {
      toast.error('Please create a studio first.', { theme: 'dark' });
      return;
    }
    if (inviteeEmail.trim() !== '' && isValidEmail(inviteeEmail)) {
      setIsSendingInvite(true); // Set loading for invite button

      const body = {
        sessionId,
        userId,
        guestEmail: inviteeEmail,
        guestName: inviteeEmail.split('@')[0],
      };

      try {
        const response = await axiosInstance.post(
          '/session/send-invitation',
          body
        );
        toast.success(response.data.message, { theme: 'dark' });
        setIsInviteSent(true); 
      } catch (error) {
        console.error('Error:', error);
        const msg =
          error.response?.data?.message ||
          'An error occurred while sending the invite.';
        toast.error(msg, { theme: 'dark' });
      } finally {
        setIsSendingInvite(false);
      }
    } else {
      toast.error('Please enter a valid email address.', { theme: 'dark' });
    }
  };

  const handleCreateStudio = async () => {

    if (!studioName.trim()) {
      toast.error('Please enter a studio name.', { theme: 'dark' });
      return;
    }

    dispatch(setLoading(true));

    const scheduledAt =
      scheduledDetails?.date && scheduledDetails?.time
        ? new Date(
            `${scheduledDetails.date}T${scheduledDetails.time}:00Z`
          ).toISOString()
        : new Date().toISOString();

    const body = {
      title: studioName,
      scheduledAt,
      host: userId,
    };

    try {
      const response = await axiosInstance.post('/session/create-session', body);

      dispatch(setSession(response.data.session));
      setHasCurrentStudioBeenCreated(true);
      toast.success('Session created successfully!', { theme: 'dark' });
    } catch (error) {
      console.error('Error creating session:', error);
      const msg =
        error.response?.data?.message ||
        'An error occurred while creating session';
      dispatch(setError(msg));
      toast.error(msg, { theme: 'dark' });
    } finally {
      dispatch(setLoading(false)); // Redux loading for create studio
    }
  };

  const handleScheduleSubmit = (details) => {
    setScheduledDetails(details);
  };

  return (
    <div className='bg-[#111111]'>
      <Header />
      <main className='max-w-7xl mx-auto px-4 py-6 bg-[#111111] min-h-screen text-white'>
        <div className='flex items-center justify-between px-1 mb-6'>
          <h1 className='text-3xl font-bold'>Create New Studio</h1>
          <Link
            to='/my-studios'
            className='
              bg-[#8A65FD] hover:bg-[#7A57D1] text-md font-medium text-white py-2 px-6 rounded-lg
              transition-colors duration-300
              shadow-md hover:shadow-lg
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75
              flex items-center space-x-2
            '
          >
            <span>My Studios</span>
          </Link>
        </div>

        <div className='bg-[#1A1A1A] rounded-lg mb-6 p-6'>
          <div className='pb-6 flex flex-col md:flex-row md:justify-between md:items-center'>
            <div>
              <h3 className='text-md mb-1 font-medium'>Studio Name</h3>
              <p className='text-sm text-gray-400'> 
                You can always change this later.
              </p>
            </div>
            <div>
              <input
                type='text'
                className='rounded-lg bg-[#1E1E1E] text-white mt-3 md:mt-0 py-2 px-4 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#8A65FD] w-full md:w-64'
                placeholder='Name your studio...'
                onChange={(e) => setStudioName(e.target.value)}
                value={studioName}
                disabled={loading}
              />
            </div>
          </div>
          <Schedule
            canEdit={!hasCurrentStudioBeenCreated}
            scheduledDetails={scheduledDetails}
            onSubmit={handleScheduleSubmit}
          />
        </div>

        <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6'> 
          <Button
            onClick={handleCreateStudio}
            text={
              loading
                ? 'Creating...'
                : hasCurrentStudioBeenCreated
                ? 'Studio Created'
                : 'Create Studio'
            }
            isDisabled={loading || hasCurrentStudioBeenCreated}
            className={`${
              loading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-[#8A65FD]'
            } rounded-lg py-2 px-6 font-semibold`}
          />

        </div>

        {sessionId && hasCurrentStudioBeenCreated && (
          <div className='bg-[#1A1A1A] space-y-4 p-6 rounded-lg my-6'>
            <h3 className='text-md font-medium text-white'>Invite Guest</h3>
            <p className='text-sm text-gray-400'> 
              Invite guest to your studio by sending them an email. They will
              receive a link to join the studio.
            </p>

            <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3'>
              <input
                type='text'
                className='rounded-lg bg-[#1E1E1E] text-white py-2 px-4 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#8A65FD] w-full sm:w-72'
                placeholder='Enter guest email...'
                value={inviteeEmail}
                disabled={isInviteSent || isSendingInvite || loading}
                onChange={(e) => {
                  setInviteeEmail(e.target.value);
                  if (isInviteSent && e.target.value.trim() !== '') {
                    setIsInviteSent(false);
                  }
                }}
              />

              <Button
                text={
                  isSendingInvite
                    ? 'Sending...'
                    : isInviteSent
                    ? 'Invite Sent'
                    : 'Send Invite'
                }
                onClick={handleSendInvite}
                isDisabled={
                  isInviteSent ||
                  isSendingInvite ||
                  loading ||
                  !inviteeEmail.trim() ||
                  !isValidEmail(inviteeEmail)
                }
                className={`${
                  isInviteSent || isSendingInvite
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-[#8A65FD]'
                } rounded-lg py-2 px-6 font-semibold
                  ${(!inviteeEmail.trim() || !isValidEmail(inviteeEmail)) && 'opacity-70 cursor-not-allowed'}`} 
              />
            </div>
          </div>
        )}

        {/* NEW: Go to Studio Details Button */}
        {sessionId && hasCurrentStudioBeenCreated && isInviteSent && (
          <div className='bg-[#1A1A1A] p-6 rounded-lg my-6 text-center'>
            <h3 className='text-md font-medium text-white mb-4'>
              Your studio is ready!
            </h3>
            <Link
              to={`/my-studios/${sessionId}`}
              className='
                inline-flex items-center justify-center
                bg-[#8A65FD] text-white py-3 px-8 rounded-lg
                hover:bg-[#8A65FD]/80 transition-colors duration-300 
                shadow-lg hover:shadow-xl shadow-[#8A65FD]/10
                focus:outline-none focus:ring-2 focus:ring-[#8A65FD] focus:ring-opacity-75
                font-bold text-lg
              '
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Go to Studio Details
            </Link>
            <p className="text-sm text-gray-400 mt-4">
              You can manage recordings, chat, and invite more guests from there.
            </p>
          </div>
        )}
      </main>
      <ToastContainer />
    </div>
  );
};

export default CreateStudioPage;