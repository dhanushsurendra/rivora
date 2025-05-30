import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import StudioPage from './pages/StudioPage.jsx'
import CreateSTudioPage from './pages/CreateStudioPage.jsx'
import StudiosPage from './pages/StudiosPage.jsx'

import './index.css'
import NotFoundPage from './pages/NotFoundPage.jsx'
import DeviceSetupPage from './pages/DeviceSetupPage.jsx'

import { Provider } from 'react-redux'
import store from './redux/store.js'
import PrivateRoute from './components/PrivateRoute.jsx'

import { GoogleOAuthProvider } from '@react-oauth/google'

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },

  {
    element: <PrivateRoute />, // no path, acts as a wrapper
    children: [
      { path: '/studio', element: <StudioPage /> },
      { path: '/create-studio', element: <CreateSTudioPage /> },
      { path: '/device-setup', element: <DeviceSetupPage /> },
      { path: '/studios', element: <StudiosPage /> },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
])

const clientId =
  '188427344842-19lam0fesms8sdlli41o9lihg075dvgt.apps.googleusercontent.com'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={clientId}>
        <RouterProvider router={router} />
      </GoogleOAuthProvider>
    </Provider>
  </StrictMode>
)
