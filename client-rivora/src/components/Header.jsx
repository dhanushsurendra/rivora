import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

const Header = () => {

  const user = useSelector((state) => state.auth.user)
  const letter = user?.name?.charAt(0).toUpperCase() || 'X'

  return (
    <header className='bg-[#111111]'>
      <div className='max-w-7xl mx-auto px-4 py-4 flex items-center justify-between'>
        {/* Logo */}
        <Link
          to='/'
          className='text-2xl font-bold text-[#8A65FD] tracking-tight'
        >
          Rivora
        </Link>

        {/* Navigation - Visible only on md+ */}
        <nav className='hidden md:flex space-x-6 text-sm font-medium text-gray-300'>
          <Link to='/#features' className='hover:text-[#8A65FD] transition'>
            Features
          </Link>
          <Link to='/#how-it-works' className='hover:text-[#8A65FD] transition'>
            How it works
          </Link>
          <Link to='/#projects' className='hover:text-[#8A65FD] transition'>
            Pricing
          </Link>
        </nav>
        <div className='w-10 h-10 rounded-full flex items-center justify-center bg-[#1A1A1A]'>
          <span className='text-white font-bold'>{letter}</span>
        </div>
      </div>
    </header>
  )
}

export default Header
