import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './pages/Home.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import Podcast from './pages/Podcast.jsx'

import './index.css'

const router = createBrowserRouter([
  {path: '/', element: <HomePage />},
  {path: '/login', element: <LoginPage />},
  {path: 'signup', element: <SignupPage />},
  {path: '/video', element: <Podcast />},
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
