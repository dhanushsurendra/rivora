import { MdModeEdit } from "react-icons/md";
import { MdPersonAdd } from "react-icons/md";
import { IoPersonSharp } from "react-icons/io5";

const RightPanel = () => {
  return (
    <aside className='w-80 bg-[#1A1A1A] h-screen flex flex-col p-4 space-y-6 overflow-y-auto'>
      {/* Right Sidebar */}
      {/* People Section */}
      <div className='flex flex-col space-y-4'>
        <h3 className='text-xl font-semibold text-gray-200'>People</h3>
      </div>

      <div className='mt-2 bg-[#1E1E1E] rounded-lg'>
        <div className='flex justify-between items-center pt-3 px-3'>
          <h3 className='text-sm text-gray-400'>RECORDING OVERVIEW</h3>
        </div>

        <div className='flex items-center justify-between mt-4 rounded-md px-3'>
          <div className='flex items-center'>
            <span className='text-md font-medium'>Untitled Recording</span>
            <button className='ml-2 text-gray-400 hover:text-white'>
              <MdModeEdit />
            </button>
          </div>
          <span className='text-md font-normal text-gray-400'>00:00</span>
        </div>

        <p className='text-gray-400 text-sm mt-2 p-3'>
          Audio & Video - 720p (720p live)
        </p>

        <div className='flex items-center justify-between pt-4 px-3 pb-3'>
          <div className='flex items-center text-gray-400 space-x-2 text-sm'>
            {/* Person icon */}
            <IoPersonSharp />
            <span>Just you</span>
          </div>
          <button className='flex items-center space-x-2 bg-[#252525] text-white font-semibold py-1 px-4 rounded-lg'>
            {/* Plus icon for Invite */}
            <MdPersonAdd />
            <span>Invite</span>
          </button>
        </div>
      </div>

      {/* Dhanush User Info (detailed) */}
      <div className='bg-[#1E1E1E] rounded-lg p-3 text-gray-400 flex flex-col space-y-2'>
        <div className='flex'>
          <img
            src='https://plus.unsplash.com/premium_photo-1678197937465-bdbc4ed95815?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
            alt='User'
            className='w-10 h-10 rounded-full mr-2 object-cover'
          />
          <div>
            <p className='text-sm font-semibold text-gray-200'>Dhanush</p>
            <p className='text-xs'>Host 720p</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default RightPanel
