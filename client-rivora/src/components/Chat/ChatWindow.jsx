import React, { useState, useRef, useEffect } from 'react'
import { IoSend } from 'react-icons/io5'
import { GoX } from 'react-icons/go'

import {
  useHMSActions,
  useHMSStore,
  selectHMSMessages,
  selectLocalPeer,
} from '@100mslive/react-sdk'

const ChatPanel = ({ isOpen, handleChatToggle }) => {
  const localPeer = useHMSStore(selectLocalPeer)
  const hmsActions = useHMSActions()
  const hmsMessages = useHMSStore(selectHMSMessages)

  const [storedMessages, setStoredMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)

  // Load saved messages from localStorage on first mount
  useEffect(() => {
    const saved = localStorage.getItem('chatMessages')
    if (saved) {
      try {
        setStoredMessages(JSON.parse(saved))
      } catch (err) {
        console.error('Failed to parse chatMessages from localStorage:', err)
      }
    }
  }, [])

  // Convert HMS messages to readable format
  const liveMessages = hmsMessages
    .filter((msg) => {
      try {
        const data = JSON.parse(msg.message)
        return !data.type || data.text
      } catch {
        return true
      }
    })
    .map((msg) => {
      let parsedText = msg.message
      console.log(parsedText)
      try {
        const data = JSON.parse(msg.message)
        if (data.text) parsedText = data.text
      } catch (e) {
        console.warn('Non-JSON message:', msg.message)
      }

      return {
        id: msg.id,
        sender: msg.senderRole,
        text: parsedText,
        timestamp: new Date(msg.time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isLocal: msg.sender === localPeer?.id,
      }
    })

  // Merge stored and live messages
  const allMessages = [
    ...storedMessages,
    ...liveMessages.filter(
      (live) => !storedMessages.find((stored) => stored.id === live.id)
    ),
  ]

  // Save only new messages to localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('chatMessages')) || []
    const newOnes = allMessages.filter(
      (msg) => !saved.find((existing) => existing.id === msg.id)
    )
    if (newOnes.length > 0) {
      const updated = [...saved, ...newOnes]
      localStorage.setItem('chatMessages', JSON.stringify(updated))
      setStoredMessages(updated)
    }
  }, [hmsMessages])

  // Scroll to bottom when new messages come in
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !localPeer) return

    const messagePayload = {
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }

    try {
      await hmsActions.sendBroadcastMessage(
        JSON.stringify(messagePayload),
        'chat'
      )
      console.log('Message sent:', messagePayload.text)
    } catch (err) {
      console.error('Failed to send message:', err)
    }

    setNewMessage('')
  }

  if (!isOpen) return null

  return (
    <div className='absolute right-4 bottom-[60px] flex flex-col max-h-[550px] w-96 bg-[#1F1F1F] text-white border border-gray-700 rounded-xl z-50'>
      {/* Header */}
      <div className='flex justify-between items-center px-4 py-3 border-b border-gray-700'>
        <h3 className='text-lg font-semibold'>Chat</h3>
        <button
          onClick={handleChatToggle}
          className='text-gray-400 hover:text-white'
        >
          <GoX className='w-6 h-6' />
        </button>
      </div>

      {/* Messages */}
      <div className='flex-1 p-4 overflow-y-auto custom-scrollbar'>
        {allMessages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-3 ${msg.isLocal ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                msg.isLocal ? 'bg-[#8A65FD]' : 'bg-[#2E2E2E]'
              }`}
            >
              <p className='text-sm font-semibold'>
                {msg.isLocal
                  ? 'You'
                  : msg.sender.charAt(0).toUpperCase() + msg.sender.slice(1)}
              </p>
              <p className='text-md'>{msg.text}</p>
              <span className='text-xs text-gray-400 block mt-1'>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className='p-4 border-t border-gray-700 bg-[#1F1F1F] flex items-center space-x-3'
      >
        <input
          type='text'
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder='Type your message...'
          className='flex-1 p-3 rounded-lg bg-[#2E2E2E] text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#8A65FD]'
        />
        <button
          type='submit'
          className='p-3 rounded-lg bg-[#8A65FD] hover:bg-[#724EE0] text-white'
        >
          <IoSend className='w-6 h-6' />
        </button>
      </form>
    </div>
  )
}

export default ChatPanel
