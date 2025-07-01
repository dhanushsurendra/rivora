import React, { useState, useEffect } from 'react'
import { Link, Link as RouterLink } from 'react-router-dom'
import {
  Sparkles,
  ExternalLink,
  Mic,
  CloudUpload,
  Download,
  Check,
} from 'lucide-react'

import heroImg from '../assets/hero.jpg'

import { useDispatch, useSelector } from 'react-redux'
import { logout, removeUserFromLocalStorage } from '../redux/auth/authSlice'
import axiosInstance from '../api/axios'
import { toast, ToastContainer } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

// --- Component: Button ---
const Button = React.forwardRef(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
                 bg-[#8A65FD] text-white hover:bg-[#724EE0]
                 h-10 px-4 py-2 ${className || ''}`}
    {...props}
  >
    {children}
  </button>
))
Button.displayName = 'Button'

// --- Component: Card ---
const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border border-gray-700 bg-[#1A1A1A] text-white shadow-sm ${
      className || ''
    }`}
    {...props}
  >
    {children}
  </div>
))
Card.displayName = 'Card'

// --- Component: CardContent ---
const CardContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={`p-6 ${className || ''}`} {...props}>
      {children}
    </div>
  )
)
CardContent.displayName = 'CardContent'

// --- Main Component: HomePage ---
const HomePage = () => {
  const [headerBg, setHeaderBg] = useState(false)
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHeaderBg(true)
      } else {
        setHeaderBg(false)
      }
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout', {
        withCredentials: true,
      })

      removeUserFromLocalStorage()
      dispatch(logout())
      dispatch({ type: 'RESET_STORE' }) 

      toast.success('Logout successful!', { theme: 'dark' })

      setTimeout(() => {
        navigate('/login')
      }, 500)
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  return (
    <div className='flex flex-col min-h-screen text-white bg-[#111111]'>
      {/* Header - Sticky, with dynamic background on scroll */}
      <header
        className={`fixed w-full text-white px-6 py-8 top-0 z-50 transition-colors duration-300 ${
          headerBg ? 'bg-black/10 shadow-lg backdrop-blur-sm' : 'bg-transparent'
        }`}
      >
        <div className='max-w-7xl mx-auto flex items-center justify-center relative'>
          <Link to={'/'} className='text-xl font-semibold tracking-wide text-[#8A65FD] absolute left-0'>
            Rivora
          </Link>

          <nav className='hidden md:flex space-x-6 text-gray-300 font-medium'>
            <a
              href='#features'
              className='hover:text-[#8A65FD] transition-colors duration-200'
            >
              Features
            </a>
            <a
              href='#how-it-works'
              className='hover:text-[#8A65FD] transition-colors duration-200'
            >
              How it works
            </a>
            <a
              href='#projects'
              className='hover:text-[#8A65FD] transition-colors duration-200'
            >
              Pricing
            </a>
          </nav>

          {/* Login/Logout buttons, positioned to the right */}
          <div className='absolute right-0'>
            <RouterLink
              to='/create-studio'
              className='border-2 border-[#8A65FD] text-[#8A65FD] px-4 py-2 mr-2 rounded-full hover:bg-[#8A65FD] text-sm font-medium hover:text-white transition'
            >
              Create Studio
            </RouterLink>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className='bg-[#8A65FD] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#724EE0] transition-colors duration-200 cursor-pointer'
              >
                Logout
              </button>
            ) : (
              <RouterLink
                to='/login'
                className='bg-[#8A65FD] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#724EE0] transition-colors duration-200 cursor-pointer'
              >
                Login
              </RouterLink>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Full height with image covering right side */}
      <section className='relative h-screen flex'>
        {/* Background image for small screens */}
        <div className='absolute inset-0 md:hidden'>
          <img
            src={heroImg}
            alt='Rivora Recording Overview Interface'
            className='w-full h-full object-cover'
          />
          {/* <div className='absolute inset-0 bg-gradient-to-r from-[#0F0F11]/80 to-transparent'></div> */}
        </div>

        {/* Left Side - Text Content with gradient overlay */}
        <div className='relative z-20 w-full md:w-1/2 flex items-center justify-center px-6 md:px-12'>
          <div className='relative z-20 text-center md:text-left max-w-lg'>
            <h2 className='text-3xl md:text-5xl font-bold text-white leading-tight mb-6'>
              Create Studio-Quality
              <br /> Remote Recordings
              <br /> Effortlessly
            </h2>
            <p className='text-gray-400 mb-8'>
              Rivora lets you record crystal-clear audio and video from
              anywhere. Perfect for podcasts, interviews, and collaboration.
            </p>
            <div className='flex gap-4 justify-center md:justify-start'>
              <Link to={'/create-studio'} className='bg-[#8A65FD] text-white cursor-pointer px-6 py-3 rounded-lg font-medium text-sm hover:bg-[#724EE0]'>
                Get Started
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side - Full height image */}
        <div className='w-0 md:w-1/2 h-full'>
          <div className='absolute inset-0 bg-gradient-to-br from-[#111111] to-[#1A1A1A] opacity-55 z-10'></div>
          <img
            src={heroImg}
            alt='Rivora Recording Overview Interface'
            className='w-full h-full object-cover'
          />
          {/* Gradient overlay on mobile to ensure text readability */}
          <div className='absolute inset-0 bg-gradient-to-r from-[#0F0F11]/80 to-transparent md:hidden'></div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='px-6 py-20 bg-[#111111]'>
        <h2 className='text-3xl font-bold text-center mb-12 text-white'>
          Features
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto'>
          <Card>
            <CardContent className='p-6'>
              <Sparkles className='text-[#8A65FD] mb-4' size={32} />
              <h3 className='text-xl font-semibold mb-2 text-white'>
                High-Quality Recording
              </h3>
              <p className='text-gray-400'>
                Locally recorded audio & video, synced and backed up in the
                cloud.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6'>
              <Sparkles className='text-[#8A65FD] mb-4' size={32} />
              <h3 className='text-xl font-semibold mb-2 text-white'>
                Real-Time Collaboration
              </h3>
              <p className='text-gray-400'>
                Host interviews or podcasts with multiple guests in real-time.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6'>
              <Sparkles className='text-[#8A65FD] mb-4' size={32} />
              <h3 className='text-xl font-semibold mb-2 text-white'>
                Separate Tracks
              </h3>
              <p className='text-gray-400'>
                Download video files for each participant.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works Section */}
      <section id='how-it-works' className='px-6 py-20 bg-[#1A1A1A]'>
        <h2 className='text-3xl font-bold text-center mb-12 text-white'>
          How It Works
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto'>
          {/* Step 1 */}
          <div className='flex flex-col items-center text-center p-6 bg-[#111111] rounded-lg border border-gray-700 hover:shadow-lg transition-shadow duration-200'>
            <div className='p-3 mb-4 rounded-full bg-[#8A65FD] text-white'>
              <ExternalLink size={28} />
            </div>
            <h3 className='text-xl font-semibold mb-2 text-white'>
              Share Link
            </h3>
            <p className='text-gray-400'>
              Share a unique room link with your guest.
            </p>
          </div>

          {/* Step 2 */}
          <div className='flex flex-col items-center text-center p-6 bg-[#111111] rounded-lg border border-gray-700 hover:shadow-lg transition-shadow duration-200'>
            <div className='p-3 mb-4 rounded-full bg-[#8A65FD] text-white'>
              <Mic size={28} />
            </div>
            <h3 className='text-xl font-semibold mb-2 text-white'>
              Record Locally
            </h3>
            <p className='text-gray-400'>
              Record crystal-clear audio & video directly on each device.
            </p>
          </div>

          {/* Step 3 */}
          <div className='flex flex-col items-center text-center p-6 bg-[#111111] rounded-lg border border-gray-700 hover:shadow-lg transition-shadow duration-200'>
            <div className='p-3 mb-4 rounded-full bg-[#8A65FD] text-white'>
              <CloudUpload size={28} />
            </div>
            <h3 className='text-xl font-semibold mb-2 text-white'>
              Auto-Upload
            </h3>
            <p className='text-gray-400'>
              Seamlessly upload recordings to the cloud in the background.
            </p>
          </div>

          {/* Step 4 */}
          <div className='flex flex-col items-center text-center p-6 bg-[#111111] rounded-lg border border-gray-700 hover:shadow-lg transition-shadow duration-200'>
            <div className='p-3 mb-4 rounded-full bg-[#8A65FD] text-white'>
              <Download size={28} />
            </div>
            <h3 className='text-xl font-semibold mb-2 text-white'>
              Download Tracks
            </h3>
            <p className='text-gray-400'>
              Get clean, high-resolution separate tracks when you're done.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id='pricing' className='px-6 py-20 bg-[#111111]'>
        <h2 className='text-3xl font-bold text-center mb-12 text-white'>
          Pricing
        </h2>
        <div className='max-w-6xl mx-auto text-center'>
          <p className='text-lg text-gray-300 mb-10'>
            Start for free, upgrade as you grow. Choose the perfect plan for
            your recording needs.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {/* Free Plan */}
            <Card className='flex flex-col justify-between p-6'>
              <CardContent className='p-0 text-left'>
                <h3 className='text-2xl font-bold mb-2 text-white'>
                  Free Plan
                </h3>
                <p className='text-gray-400 mb-4'>
                  Perfect for getting started.
                </p>
                <div className='text-4xl font-bold text-white mb-6'>
                  $0<span className='text-xl text-gray-400'>/month</span>
                </div>
                <ul className='text-gray-300 space-y-3 mb-8'>
                  <li className='flex items-center'>
                    <Check className='text-[#8A65FD] mr-2' size={18} />
                    Up to 2 Guests
                  </li>
                  <li className='flex items-center'>
                    <Check className='text-[#8A65FD] mr-2' size={18} />
                    Limited Cloud Storage
                  </li>
                  <li className='flex items-center'>
                    <Check className='text-[#8A65FD] mr-2' size={18} />
                    Standard Quality Recording
                  </li>
                  <li className='flex items-center opacity-50'>
                    <Check className='text-gray-600 mr-2' size={18} />
                    No Separate Tracks
                  </li>
                  <li className='flex items-center opacity-50'>
                    <Check className='text-gray-600 mr-2' size={18} />
                    Community Support
                  </li>
                </ul>
              </CardContent>
              <Button className='w-full'>Sign Up for Free</Button>
            </Card>
            {/* Pro Plan (Highlighted) */}
            <Card className='flex flex-col justify-between p-6 relative overflow-hidden border-2 border-[#8A65FD] transform scale-105 shadow-xl'>
              <div className='absolute top-0 right-0 bg-[#8A65FD] text-white text-xs font-bold px-3 py-1 rounded-bl-lg transform rotate-45 translate-x-1/2 -translate-y-1/2 origin-top-right'>
                <span className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform -rotate-45'>
                  POPULAR
                </span>
              </div>
              <CardContent className='p-0 text-left'>
                <h3 className='text-2xl font-bold mb-2 text-white'>Pro Plan</h3>
                <p className='text-gray-400 mb-4'>
                  For growing podcasts and interviews.
                </p>
                <div className='text-4xl font-bold text-white mb-6'>
                  $19<span className='text-xl text-gray-400'>/month</span>
                </div>
                <ul className='text-gray-300 space-y-3 mb-8'>
                  <li className='flex items-center'>
                    <Check className='text-[#8A65FD] mr-2' size={18} />
                    Unlimited Guests
                  </li>
                  <li className='flex items-center'>
                    <Check className='text-[#8A65FD] mr-2' size={18} />
                    Generous Cloud Storage
                  </li>
                  <li className='flex items-center'>
                    <Check className='text-[#8A65FD] mr-2' size={18} />
                    Studio-Quality Recording
                  </li>
                  <li className='flex items-center'>
                    <Check className='text-[#8A65FD] mr-2' size={18} />
                    Separate Audio/Video Tracks
                  </li>
                  <li className='flex items-center'>
                    <Check className='text-[#8A65FD] mr-2' size={18} />
                    Email Support
                  </li>
                </ul>
              </CardContent>
              <Button className='w-full'>Get Pro</Button>
            </Card>
            {/* Pro Plus Plan (New) */}
            <Card className='flex flex-col justify-between p-6'>
              <CardContent className='p-0 text-left'>
                <h3 className='text-2xl font-bold mb-2 text-white'>
                  Pro Plus Plan
                </h3>
                <p className='text-gray-400 mb-4'>
                  Advanced features for professional teams.
                </p>
                <div className='text-4xl font-bold text-white mb-6'>
                  $49<span className='text-xl text-gray-400'>/month</span>
                </div>
                <ul className='text-gray-300 space-y-3 mb-8'>
                  <li className='flex items-center'>
                    <Check className='text-[#8A65FD] mr-2' size={18} />
                    All Pro Plan Features
                  </li>
                  <li className='flex items-center'>
                    <Check className='text-[#8A65FD] mr-2' size={18} />
                    Unlimited Storage
                  </li>
                  <li className='flex items-center'>
                    <Check className='text-[#8A65FD] mr-2' size={18} />
                    Advanced Analytics
                  </li>
                  <li className='flex items-center'>
                    <Check className='text-[#8A65FD] mr-2' size={18} />
                    Dedicated Priority Support
                  </li>
                  <li className='flex items-center'>
                    <Check className='text-[#8A65FD] mr-2' size={18} />
                    Team Management
                  </li>
                </ul>
              </CardContent>
              <Button className='w-full'>Get Pro Plus</Button>
            </Card>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer id='footer' className='bg-[#1A1A1A] text-white py-10 px-6 mt-auto'>
        <div className='max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6'>
          <div className='text-lg'>© 2025 Rivora. All rights reserved.</div>
          <nav className='space-x-6 text-gray-400 text-sm'>
            <a
              href='#features'
              className='hover:underline hover:text-[#8A65FD]'
            >
              {' '}
              Features{' '}
            </a>
            <a
              href='#how-it-works'
              className='hover:underline hover:text-[#8A65FD]'
            >
              {' '}
              How it works{' '}
            </a>
            <a href='#pricing' className='hover:underline hover:text-[#8A65FD]'>
              {' '}
              Pricing{' '}
            </a>
          </nav>
        </div>
      </footer>
      <ToastContainer />
    </div>
  )
}

export default HomePage
