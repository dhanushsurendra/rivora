import './App.css'
import Podcast from './pages/StudioPage'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { authSuccess } from './redux/auth/authSlice'

import { useNavigate } from 'react-router-dom'

const App = () => {

  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    console.log(savedUser)
    if (savedUser) {
      dispatch(authSuccess(JSON.parse(savedUser)))
      navigate('/')
    }
  }, [dispatch])

  return <Podcast />
}

export default App
