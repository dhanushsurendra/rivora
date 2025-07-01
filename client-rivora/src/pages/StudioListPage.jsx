import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify'
import axiosInstance from '../api/axios'
import StudioCard from '../components/Studio/StudioCard' // Import the new component
import { MoonLoader } from 'react-spinners'
import Header from '../components/Header'
import { Link } from 'react-router-dom'

const StudioListPage = () => {
  const userId = useSelector((state) => state.auth.user._id) // Assuming user ID is available in Redux
  const [studios, setStudios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStudios = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await axiosInstance.get(`/session/my-sessions`)
        setStudios(response.data.sessions || [])
      } catch (err) {
        console.error('Error fetching studios:', err)
        setError(err.response?.data?.message || 'Failed to fetch studios.')
        toast.error(err.response?.data?.message || 'Failed to fetch studios.', {
          theme: 'dark',
        })
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      // Fetch only if userId is available
      fetchStudios()
    }
  }, [userId])

  const sortedStudios = [...studios].sort((a, b) => {
    const now = new Date()

    const getStatus = (studio) => {
      const start = new Date(studio.scheduledAt)
      const end = new Date(start.getTime() + 60 * 60 * 1000)

      if (studio.isLive || (now >= start && now < end)) return 0 // live
      if (now < start) return 1 // upcoming
      return 2 // ended
    }

    return getStatus(a) - getStatus(b)
  })

  return (
    <div className='bg-[#111111] min-h-screen text-white'>
      <Header />
      <main className='max-w-7xl mx-auto px-4 py-6'>
        <div className='flex items-center justify-between mb-6 space-y-4'>
          <h1 className='text-3xl font-bold'>My Studios</h1>
          <Link
            to={`/create-studio`}
            className='
              inline-flex items-center text-sm -mt-3 justify-center
              bg-[#8A65FD] hover:bg-[#7A57D1] text-white font-medium py-2 px-4 rounded-lg
              transition-colors duration-300
              shadow-md hover:shadow-lg
              focus:outline-none focus:ring-2 focus:ring-[#8A65FD] focus:ring-opacity-75
            '
          >
            <span>Create Studio</span>
          </Link>
        </div>

        {loading && (
          <div className='flex justify-center items-center min-h-128'>
            <MoonLoader color='#8A65FD' size={50} />
          </div>
        )}
        {error && <p className='text-center text-white'>{error}</p>}
        {!loading && studios.length === 0 && !error && (
          <p className='text-center text-gray-400'>No studios created yet.</p>
        )}

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {sortedStudios.map((studio) => (
            <StudioCard key={studio._id} studio={studio} />
          ))}
        </div>
      </main>
      <ToastContainer />
    </div>
  )
}

export default StudioListPage
