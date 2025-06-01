// src/pages/CreateStudioPage.jsx
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import Button from '../components/Button/Button';
import Schedule from '../components/Schedule';
import { useDispatch, useSelector } from 'react-redux';
import {
  setSession,
  setLoading,
  setError,
  clearSession,
} from '../redux/session/sessionSlice';
import axiosInstance from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const CreateStudioPage = () => {
  // Initialize states from localStorage
  const [inviteeEmail, setInviteeEmail] = useState(() => {
    return localStorage.getItem('inviteeEmail') || '';
  });
  const [isInviteSent, setIsInviteSent] = useState(() => {
    const storedValue = localStorage.getItem('isInviteSent');
    return storedValue === 'true';
  });
  const [joinLink, setJoinLink] = useState(() => {
    return localStorage.getItem('joinLink') || '';
  });
  const [copyStatus, setCopyStatus] = useState('Copy');
  const [scheduledDetails, setScheduledDetails] = useState(null);
  const [studioName, setStudioName] = useState(() => {
    return localStorage.getItem('studioName') || '';
  });

  const [hasCurrentStudioBeenCreated, setHasCurrentStudioBeenCreated] =
    useState(() => {
      const storedValue = localStorage.getItem('hasCurrentStudioBeenCreated');
      return storedValue === 'true';
    });

  // NEW STATE: For the "Send Invite" button's loading state
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Initialize useNavigate
  const navigate = useNavigate();

  // --- useEffects to persist states to localStorage ---
  useEffect(() => {
    localStorage.setItem('isInviteSent', isInviteSent.toString());
  }, [isInviteSent]);

  useEffect(() => {
    localStorage.setItem('inviteeEmail', inviteeEmail);
  }, [inviteeEmail]);

  useEffect(() => {
    localStorage.setItem('joinLink', joinLink);
  }, [joinLink]);

  useEffect(() => {
    localStorage.setItem('studioName', studioName);
  }, [studioName]);

  useEffect(() => {
    localStorage.setItem(
      'hasCurrentStudioBeenCreated',
      hasCurrentStudioBeenCreated.toString()
    );
  }, [hasCurrentStudioBeenCreated]);

  // --- Redux Selectors ---
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.session.loading); // Redux loading for Create Studio
  const userId = useSelector((state) => state.auth.user._id);
  const session = useSelector((state) => state.session.session); // Get the whole session object
  const sessionId = session?._id; // Extract _id

  // --- Initial Redux Session Check on Mount ---
  useEffect(() => {
    if (sessionId && !hasCurrentStudioBeenCreated) {
      setHasCurrentStudioBeenCreated(true);
      // If Redux has a session but local state doesn't reflect it, sync local state
      // Also populate studioName and scheduledDetails from Redux if session exists
      if (session?.title) setStudioName(session.title);
      if (session?.scheduledAt) {
        const sessionDate = new Date(session.scheduledAt);
        setScheduledDetails({
          date: sessionDate.toISOString().split('T')[0],
          time: sessionDate.toISOString().split('T')[1].substring(0, 5),
        });
      }
      const frontendBaseUrl = 'http://localhost:5173';
      setJoinLink(`${frontendBaseUrl}/join/${sessionId}`);
    } else if (!sessionId && hasCurrentStudioBeenCreated) {
      // If Redux session is gone but local state says it's created, reset local state
      setHasCurrentStudioBeenCreated(false);
      setStudioName('');
      setScheduledDetails(null);
      setInviteeEmail('');
      setIsInviteSent(false);
      setJoinLink('');
      setCopyStatus('Copy');
      setIsSendingInvite(false); // Reset this too for a clean slate

      // Clear localStorage for a clean start if Redux session is gone
      localStorage.removeItem('inviteeEmail');
      localStorage.removeItem('isInviteSent');
      localStorage.removeItem('joinLink');
      localStorage.removeItem('studioName');
      localStorage.removeItem('hasCurrentStudioBeenCreated');
    }
  }, [sessionId, hasCurrentStudioBeenCreated, session]); // Add 'session' to dependencies

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCopyLink = async () => {
    if (joinLink) {
      try {
        await navigator.clipboard.writeText(joinLink);
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy'), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
        setCopyStatus('Failed to Copy');
      }
    }
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
        console.log(response)
        if (response.data.audienceLink) {
          setJoinLink(response.data.audienceLink);
        }
        toast.success(response.data.message, { theme: 'dark' });
        setIsInviteSent(true); // Mark invite as sent
        setInviteeEmail(''); // Clear email input after sending
      } catch (error) {
        console.error('Error:', error);
        const msg =
          error.response?.data?.message ||
          'An error occurred while sending the invite.';
        toast.error(msg, { theme: 'dark' });
      } finally {
        setIsSendingInvite(false); // Always stop loading, regardless of success or error
      }
    } else {
      toast.error('Please enter a valid email address.', { theme: 'dark' });
    }
  };

  const handleCreateStudio = async () => {
    if (sessionId || hasCurrentStudioBeenCreated) {
      toast.error(
        'A studio has already been created or is being processed. Please create another studio.',
        { theme: 'dark' }
      );
      return;
    }

    if (!studioName.trim()) {
      toast.error('Please enter a studio name.', { theme: 'dark' });
      return;
    }

    dispatch(setLoading(true)); // Redux loading for create studio

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

  const handleCreateAnotherStudio = () => {
    dispatch(clearSession());
    setStudioName('');
    setScheduledDetails(null);
    setInviteeEmail('');
    setIsInviteSent(false);
    setJoinLink('');
    setCopyStatus('Copy');
    setHasCurrentStudioBeenCreated(false);
    setIsSendingInvite(false); // Reset this too for a clean slate

    localStorage.removeItem('inviteeEmail');
    localStorage.removeItem('isInviteSent');
    localStorage.removeItem('joinLink');
    localStorage.removeItem('studioName');
    localStorage.removeItem('hasCurrentStudioBeenCreated');

    toast.info('Form cleared. Ready to create a new studio!', { theme: 'dark' });
  };

  return (
    <div className='bg-[#111111]'>
      <Header />
      <main className='max-w-7xl mx-auto px-4 py-6 bg-[#111111] min-h-screen text-white'>
        <div className='flex items-center justify-between px-1 mb-6'> {/* Increased mb-4 to mb-6 for more breathing room */}
          <h1 className='text-3xl font-bold'>Create New Studio</h1>
          <Link
            to='/my-studios'
            className='
              bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-lg
              transition-colors duration-300
              shadow-md hover:shadow-lg
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75
              flex items-center space-x-2
            '
          >
            <span>My Studios</span>
          </Link>
        </div>

        <div className='bg-[#252525] rounded-lg mb-6 p-6'>
          <div className='pb-6 flex flex-col md:flex-row md:justify-between md:items-center'>
            <div>
              <h3 className='text-md mb-1 font-medium'>Studio Name</h3>
              <p className='text-sm text-gray-400'> {/* Consistent text-sm for descriptive text */}
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
                disabled={hasCurrentStudioBeenCreated || loading}
              />
            </div>
          </div>
          <Schedule
            canEdit={!hasCurrentStudioBeenCreated}
            scheduledDetails={scheduledDetails}
            onSubmit={handleScheduleSubmit}
          />
        </div>

        {/* Create Studio Button (and the new Create Another Studio Button) */}
        <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6'> {/* Added mb-6 for consistent spacing */}
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
              loading || hasCurrentStudioBeenCreated
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-[#8A65FD]'
            } rounded-lg py-2 px-6 font-semibold`}
          />

          {hasCurrentStudioBeenCreated && (
            <Button
              text='Create Another Studio'
              onClick={handleCreateAnotherStudio}
              isDisabled={loading || isSendingInvite}
              className={`bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 px-6 font-semibold
                ${(loading || isSendingInvite) ? 'cursor-not-allowed opacity-70' : ''}`} 
            />
          )}
        </div>

        {/* Invite Guest Box - Only show if a studio has been created (sessionId exists in Redux) */}
        {sessionId && (
          <div className='bg-[#252525] space-y-4 p-6 rounded-lg my-6'>
            <h3 className='text-md font-medium text-white'>Invite Guest</h3>
            <p className='text-sm text-gray-400'> {/* Changed to text-sm for consistency with other descriptive text */}
              Invite guest to your studio by sending them an email. They will
              receive a link to join the studio.
            </p>

            <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3'> {/* Adjusted spacing */}
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

        {/* Participant Join Link Box - Only show if joinLink exists AND a studio has been created */}
        {joinLink && sessionId && (
          <div className='bg-[#252525] space-y-4 p-6 rounded-lg my-6'>
            <h3 className='text-md font-medium text-white'>
              Participant Join Link
            </h3>
            <p className='text-sm text-gray-400'> {/* Changed to text-sm for consistency */}
              Share this link directly with participants to join the studio
              session.
            </p>

            <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3'> {/* Adjusted spacing */}
              <input
                type='text'
                readOnly
                className='rounded-lg bg-[#1E1E1E] text-white py-2 px-4 border border-gray-600 w-full focus:outline-none cursor-text'
                value={joinLink}
              />
              <Button
                text={copyStatus}
                onClick={handleCopyLink}
                className={`
                  ${copyStatus === 'Copied!' ? 'bg-green-600' : 'bg-[#8A65FD]'}
                  ${copyStatus === 'Failed to Copy' ? 'bg-red-600' : ''}
                  rounded-lg py-2 px-6 font-semibold
                `}
              />
            </div>
          </div>
        )}

        {/* NEW: Go to Studio Details Button */}
        {sessionId && joinLink && hasCurrentStudioBeenCreated && (
          <div className='bg-[#252525] p-6 rounded-lg my-6 text-center'>
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
            <p className="text-sm text-gray-400 mt-4"> {/* Changed to text-sm for consistency */}
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