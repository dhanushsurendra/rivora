const UserVideos = ({
  roomFull,
  permissionDenied,
  stream,
  userVideo,
  peerVideo,
  otherUserId,
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
                className='w-full h-full object-cover rotate-y-180'
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
                className='w-full h-full object-cover rotate-y-180'
              />
            ) : (
              <div className='text-gray-400 text-2xl'>
                Awaiting remote stream...
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
