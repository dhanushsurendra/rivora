import { GoPeople, GoPersonAdd } from 'react-icons/go'
import { IoMdCloudUpload } from 'react-icons/io'


const Header = ({
  participantCount,
  title,
  userInitial = 'L',
  isUploading,
  uploadProgress,
}) => {
  return (
    <header className='relative flex items-center justify-between px-6 py-3 bg-[#111111] z-10'>
      {}
      <div className='flex items-center space-x-4'>
        <h2 className='text-lg font-semibold text-gray-200'>{title}</h2>
        <div className='flex items-center space-x-2 bg-[#252525] text-white text-sm py-2 px-4 rounded-lg'>
          <GoPeople className='w-4 h-4' />
          <span>{participantCount}</span>
        </div>
      </div>

      {}
      <h1 className='absolute left-1/2 -translate-x-1/2 text-2xl font-bold tracking-wide text-[#8A65FD]'>
        Rivora
      </h1>

      {}
      <div className='flex items-center space-x-4'>
        {}
        {isUploading ? (
          <div className='flex items-center space-x-2 text-gray-400'>
            <IoMdCloudUpload className='w-6 h-6 animate-pulse' />{' '}
            {}
            <span className='text-sm font-medium'>{uploadProgress}%</span>
          </div>
        ) : (
          
          <IoMdCloudUpload className='w-6 h-6 text-gray-400' />
        )}
        <div className='w-8 h-8 rounded-full bg-[#252525] flex items-center justify-center text-sm font-semibold text-white'>
          {userInitial}
        </div>
      </div>
    </header>
  )
}

export default Header
