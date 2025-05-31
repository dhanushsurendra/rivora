const Header = () => {
  return (
    <header className='bg-[#11111]'>
      <div className='max-w-7xl mx-auto px-4 py-4 flex items-center justify-between'>
        <h1 className='text-2xl font-bold tracking-wide text-[#8A65FD]'>
          Rivora
        </h1>
        <div className='flex items-center space-x-4'>
          <div className='bg-[rgba(119,79,242,0.6)] rounded-full w-10 h-10 text-white flex items-center justify-center text-xl font-semibold'>
            L
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
