const UserVideos = ({
  roomFull,
  permissionDenied,
  stream,
  userVideo,
  peerVideo,
  otherUserId,
  showDialog,
  setShowDialog
}) => {
  return (
    <main className='flex-1 p-4 flex flex-row items-stretch justify-center space-x-4'>
      {roomFull ? (
        <div className='bg-red-900 text-red-300 p-8 rounded-lg text-3xl font-semibold text-center max-w-lg flex items-center justify-center w-full h-full'>
          Room is Full! Please try again later.
        </div>
      ) : permissionDenied ? (
        <div className='bg-yellow-900 text-yellow-300 p-8 rounded-lg text-2xl font-medium text-center max-w-lg flex items-center justify-center w-full h-full'>
          Please allow camera and microphone access to start the call.
        </div>
      ) : (
        <>
          {/* Local User Video (Left Pane) */}
          <div className='relative flex-1 bg-black rounded-lg overflow-hidden shadow-xl border border-gray-700 flex items-center justify-center'>
            {stream ? (
              <video
                ref={userVideo}
                autoPlay
                muted
                playsInline
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='text-gray-400 text-2xl'>
                Awaiting local stream...
              </div>
            )}
            <div className='absolute bottom-4 left-4 text-white text-md px-4 py-2 rounded-full flex items-center space-x-2'>
              <span>Dhanush</span>
            </div>
          </div>

          {/* Remote Peer Video (Right Pane) */}
          <div className='relative flex-1 bg-[#1E1E1E] rounded-lg overflow-hidden shadow-xl border border-gray-700 flex items-center justify-center'>
            {otherUserId ? (
              <video
                ref={peerVideo}
                autoPlay
                playsInline
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='w-full max-w-xl text-center space-y-4 text-white'>
                <h2 className='text-xl font-semibold'>Invite people</h2>
                <p className='text-sm text-gray-400'>
                  Send this link to people to invite them to your studio.
                </p>

                <div className='flex items-center gap-2'>
                  <input
                    type='text'
                    value='https://your-studio-link.com/invite'
                    readOnly
                    className='flex-1 px-3 py-3 focus:outline-none rounded bg-[#252525] text-white text-sm'
                  />
                  <div className='relative w-40'>
                    <select className='appearance-none w-full px-3 py-3 bg-[#252525] text-white rounded-md text-sm pr-10 focus:outline-none'>
                      <option>Guest</option>
                      <option>Audience</option>
                    </select>
                    <div className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400'>
                      <svg
                        className='h-4 w-4'
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                      >
                        <path
                          fillRule='evenodd'
                          d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  </div>

                  <button className='px-3 cursor-pointer py-3 bg-[#8A65FD] hover:bg-[#6f4ed1] text-white rounded-md text-sm'>
                    Copy Link
                  </button>
                </div>
                <p>or</p>
                <button
                  className='px-6 py-2 bg-[#252525] text-white rounded-md text-sm'
                  onClick={() => setShowDialog(true)}
                >
                  Invite by Email
                </button>

                {showDialog && (
                  <div className='fixed inset-0 flex items-center justify-center bg-black/50 z-50'>
                    <div className='bg-[#2a2a2a] p-6 rounded-lg w-full max-w-sm border border-gray-700'>
                      <h3 className='text-white text-lg mb-4'>
                        Invite by Email
                      </h3>
                      <input
                        type='email'
                        placeholder='Enter email address'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='w-full px-3 py-2 mb-4 rounded bg-[#1e1e1e] text-white border border-gray-600 text-sm'
                      />
                      <div className='flex justify-end gap-2'>
                        <button
                          className='px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded text-white'
                          onClick={() => setShowDialog(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className='px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white'
                          onClick={() => {
                            setShowDialog(false)
                            setEmail('')
                          }}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {otherUserId && (
              <div className='absolute bottom-4 left-4 text-white text-md px-4 py-2'>
                <span>Guest</span>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  )
}

export default UserVideos
