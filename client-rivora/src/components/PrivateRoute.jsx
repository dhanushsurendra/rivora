import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

const PrivateRoute = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  if (!isAuthenticated) {
    // Not logged in, redirect to login page
    return <Navigate to='/login' replace />
  }

  // Logged in, render the child routes/components
  return <Outlet />
}

export default PrivateRoute
