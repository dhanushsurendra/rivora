import { GoPeople, GoPersonAdd } from 'react-icons/go';
import { IoMdCloudUpload } from 'react-icons/io';

const Header = ({ participantCount, onInviteClick, userInitial = 'L' }) => {
  return (
    <header className='relative flex items-center justify-between px-6 py-3 bg-[#111111] z-10'>
      {/* Left Side */}
      <div className='flex items-center space-x-4'>
        <h2 className='text-lg font-semibold text-gray-200'>
          Riverside Tutorial 2023
        </h2>
        <div className='flex items-center space-x-2 bg-[#252525] text-white text-sm py-2 px-4 rounded-lg'>
          <GoPeople className='w-4 h-4' />
          <span>{participantCount}</span>
        </div>
        <button
          onClick={onInviteClick}
          className='flex items-center space-x-1 bg-[#252525] cursor-pointer text-white text-sm py-2 px-4 hover:text-white rounded-lg transition-colors duration-200'
        >
          <GoPersonAdd className='w-5 h-5' />
          <span>Invite</span>
        </button>
      </div>

      {/* Center - Rivora */}
      <div className='absolute left-1/2 transform -translate-x-1/2 text-lg font-bold text-white'>
        Rivora
      </div>

      {/* Right Side */}
      <div className='flex items-center space-x-4'>
        <IoMdCloudUpload className='w-6 h-6 text-gray-400' />
        <div className='w-8 h-8 rounded-full bg-[#252525] flex items-center justify-center text-sm font-semibold text-white'>
          {userInitial}
        </div>
      </div>
    </header>
  );
};

export default Header;