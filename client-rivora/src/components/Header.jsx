import { useState, useEffect, useRef } from 'react'; 
import { useSelector, useDispatch } from 'react-redux'; 
import { Link, useNavigate } from 'react-router-dom'; 
import { logout, removeUserFromLocalStorage } from '../redux/auth/authSlice';
import { toast } from 'react-toastify';


const Header = () => {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated); 
  const letter = user?.name?.charAt(0).toUpperCase() || 'X';

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const profileRef = useRef(null); 
  const popoverRef = useRef(null); 

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
      
      removeUserFromLocalStorage(); 
      dispatch(logout()); 
      dispatch({ type: 'RESET_STORE' }); 

      toast.success('Logout successful!', { theme: 'dark' });

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
        {}
        <Link
          to='/'
          className='text-2xl font-bold text-[#8A65FD] tracking-tight'
        >
          Rivora
        </Link>

        {}
        <nav className='hidden md:flex space-x-6 text-sm font-medium text-gray-300'>
          <Link to='/#features' className='hover:text-[#8A65FD] transition'>
            Features
          </Link>
          <Link to='/#how-it-works' className='hover:text-[#8A65FD] transition'>
            How it works
          </Link>
          <Link to='/#pricing' className='hover:text-[#8A65FD] transition'> {}
            Pricing
          </Link>
        </nav>

        {}
        <div className='relative'> {}
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

          {}
          {showProfilePopover && isAuthenticated && ( 
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