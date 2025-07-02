import React, { useState, useEffect, useRef } from 'react'; // Import React, useState, useEffect, useRef
import { useSelector, useDispatch } from 'react-redux'; // Import useDispatch
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { logout, removeUserFromLocalStorage } from '../redux/auth/authSlice'; // Ensure these are imported
import { toast } from 'react-toastify'; // Import toast


const Header = () => {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated); // Get isAuthenticated state
  const letter = user?.name?.charAt(0).toUpperCase() || 'X';

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State for user profile popover
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const profileRef = useRef(null); // Ref for the profile icon button
  const popoverRef = useRef(null); // Ref for the popover itself

  // Effect to close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
      ) {
        setShowProfilePopover(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // In a real application, you might also have an API call here:
      // await axiosInstance.post('/auth/logout');

      removeUserFromLocalStorage(); // Clear local storage (if used for token)
      dispatch(logout()); // Dispatch Redux logout action
      dispatch({ type: 'RESET_STORE' }); // Dispatch action to reset Redux store if needed

      toast.success('Logout successful!', { theme: 'dark' });

      // Close popover after logout
      setShowProfilePopover(false);

      setTimeout(() => {
        navigate('/login');
      }, 500);
    } catch (error) {
      console.error('Logout failed', error);
      toast.error('Logout failed.', { theme: 'dark' });
    }
  };


  return (
    <header className='bg-[#111111]'>
      <div className='max-w-7xl mx-auto px-4 py-4 flex items-center justify-between'>
        {/* Logo */}
        <Link
          to='/'
          className='text-2xl font-bold text-[#8A65FD] tracking-tight'
        >
          Rivora
        </Link>

        {/* Navigation - Visible only on md+ */}
        <nav className='hidden md:flex space-x-6 text-sm font-medium text-gray-300'>
          <Link to='/#features' className='hover:text-[#8A65FD] transition'>
            Features
          </Link>
          <Link to='/#how-it-works' className='hover:text-[#8A65FD] transition'>
            How it works
          </Link>
          <Link to='/#pricing' className='hover:text-[#8A65FD] transition'> {/* Changed to #pricing */}
            Pricing
          </Link>
        </nav>

        {/* User Profile / Login Button */}
        <div className='relative'> {/* Added relative positioning for the popover */}
          {isAuthenticated ? (
            <button
              ref={profileRef}
              onClick={() => setShowProfilePopover(!showProfilePopover)}
              className='w-10 h-10 rounded-full bg-[#8A65FD] text-white flex items-center justify-center font-bold text-lg cursor-pointer hover:bg-[#724EE0] transition-colors duration-200'
            >
              {letter}
            </button>
          ) : (
            <Link
              to='/login'
              className='bg-[#8A65FD] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#724EE0] transition-colors duration-200 cursor-pointer'
            >
              Login
            </Link>
          )}

          {/* Profile Popover */}
          {showProfilePopover && isAuthenticated && ( // Show popover only if authenticated
            <div
              ref={popoverRef}
              className='absolute right-0 mt-2 w-72 bg-[#1A1A1A] border border-gray-700 rounded-lg shadow-lg py-2 z-50'
            >
              <div className='px-4 py-2 text-white font-semibold'>
                {user?.name || 'User'}
              </div>
              <div className='px-4 py-1 text-gray-400 text-sm truncate'>
                {user?.email || 'N/A'}
              </div>
              <div className='border-t border-gray-700 my-2'></div>
              <button
                onClick={handleLogout}
                className='block w-full text-left px-4 py-2 text-red-400 hover:bg-gray-800'
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;