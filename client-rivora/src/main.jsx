import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import Podcast from './pages/Podcast.jsx'
import CreateSTudioPage from './pages/CreateStudioPage.jsx'
import StudiosPage from './pages/StudiosPage.jsx'

import './index.css'
import NotFoundPage from './pages/NotFoundPage.jsx'

const router = createBrowserRouter([
  {path: '/', element: <HomePage />},
  {path: '/login', element: <LoginPage />},
  {path: '/signup', element: <SignupPage />},
  {path: '/createStudio', element: <CreateSTudioPage />},
  {path: '/studios', element: <StudiosPage />},
  {path: '/video', element: <Podcast />},
  {path: '*', element: <NotFoundPage />},
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
