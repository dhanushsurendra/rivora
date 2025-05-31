import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify'
import axiosInstance from '../api/axios'
import StudioCard from '../components/Studio/StudioCard' // Import the new component
import { MoonLoader } from 'react-spinners'
import Header from '../components/Header'

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

  return (
    <div className='bg-[#111111] min-h-screen text-white'>
      <Header />
      <main className='max-w-7xl mx-auto px-4 py-6'>
        <h1 className='text-3xl font-bold mb-6'>My Studios</h1>

        {loading && (
          <div className='flex justify-center items-center min-h-128'>
            <MoonLoader color='#8A65FD' size={50} />
          </div>
        )}
        {error && <p className='text-center text-red-500'>Error: {error}</p>}
        {!loading && studios.length === 0 && !error && (
          <p className='text-center text-gray-400'>No studios created yet.</p>
        )}

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {studios.map((studio) => (
            <StudioCard key={studio._id} studio={studio} />
          ))}
        </div>
      </main>
      <ToastContainer />
    </div>
  )
}

export default StudioListPage
