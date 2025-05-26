import React, { useState, useRef, useEffect } from 'react';
import { IoSend } from 'react-icons/io5'; // Using IoSend for a send icon
import { BsThreeDotsVertical } from 'react-icons/bs'; // For options menu
import { GoX } from 'react-icons/go'; // For close button

const ChatPanel = ({ isOpen, handleChatToggle }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'You', text: 'Hey there! How is everyone doing?', timestamp: '10:00 AM' },
    { id: 2, sender: 'Guest', text: 'Hi! All good here, thanks! 👋', timestamp: '10:01 AM' },
    { id: 3, sender: 'You', text: 'Great! Are you ready for the recording?', timestamp: '10:02 AM' },
    { id: 4, sender: 'Guest', text: 'Yep, just about. Let me know when you start.', timestamp: '10:02 AM' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          sender: 'You', // In a real app, this would be dynamic
          text: newMessage.trim(),
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setNewMessage('');
    }
  };

  if (!isOpen) {
    return null; // Don't render anything if the chat is not open
  }

  return (
    <div className='absolute bottom-[50px] flex flex-col max-h-[550px] w-96 bg-[#1F1F1F] text-white border border-gray-700 rounded-xl'>
      {/* Chat Header */}
      <div className='flex justify-between items-center px-4 py-3 border-b border-gray-700'>
        <h3 className='text-lg font-semibold'>Chat</h3>
        <div className="flex items-center space-x-2">
            <button onClick={handleChatToggle} className="cursor-pointer text-gray-400 hover:text-white transition-colors">
                <GoX className="w-6 h-6" />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className='flex-1 p-4 overflow-y-auto custom-scrollbar'>
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-3 ${msg.sender === 'You' ? 'text-right' : 'text-left'}`}>
            <div
              className={`inline-block p-2 rounded-lg ${
                msg.sender === 'You'
                  ? 'bg-[#8A65FD] text-white'
                  : 'bg-[#2E2E2E] text-gray-100'
              }`}
            >
              <p className='text-sm font-semibold'>{msg.sender}</p>
              <p className='text-md'>{msg.text}</p>
              <span className='text-xs text-opacity-80 mt-1 block' style={{ color: msg.sender === 'You' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)' }}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* Scroll to bottom reference */}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className='p-4 rounded-xl border-t border-gray-700 bg-[#1F1F1F] flex items-center space-x-3'>
        <input
          type='text'
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder='Type your message...'
          className='flex-1 p-3 rounded-lg bg-[#2E2E2E] text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#8A65FD]'
        />
        <button
          type='submit'
          className='p-3 rounded-lg bg-[#8A65FD] hover:bg-[#724EE0] transition-colors duration-200 text-white focus:outline-none focus:ring-2 focus:ring-[#8A65FD]'
        >
          <IoSend className='w-6 h-6' />
        </button>
      </form>

      {/* Custom scrollbar styles (add to your global CSS, e.g., index.css or App.css) */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #2E2E2E; /* Lighter black for track */
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #8A65FD; /* Purple for thumb */
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #724EE0; /* Darker purple on hover */
        }
      `}</style>
    </div>
  );
};

export default ChatPanel;