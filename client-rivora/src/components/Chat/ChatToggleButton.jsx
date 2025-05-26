import { BsChat } from 'react-icons/bs'
import ChatWindow from './ChatWindow'

const ChatToggleButton = ({ isOpen, handleChatToggle }) => {
  console.log(isOpen)
  return (
    <div className='relative'>
      <button
        onClick={handleChatToggle}
        className={`
                  p-2 rounded-lg w-10 h-10 bg-[#252525] text-white cursor-pointer focus:outline-none focus:ring-2 flex items-center justify-center transition-all duration-200`}
        title='Open Chat'
      >
        <BsChat className='w-5 h-5' />
      </button>

      {isOpen && (<ChatWindow isOpen={isOpen} handleChatToggle={handleChatToggle} />)}
    </div>
  )
}

export default ChatToggleButton
