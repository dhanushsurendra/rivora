import './App.css'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Provider } from 'react-redux'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import store, { persistor } from './redux/store'

import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import StudioPage from './pages/StudioPage.jsx'
import CreateSTudioPage from './pages/CreateStudioPage.jsx'
import StudiosPage from './pages/StudioListPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import DeviceSetupPage from './pages/DeviceSetupPage.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import RootLoader from './components/RootLoader.jsx'
import StudioListPage from './pages/StudioListPage.jsx'
import StudioDetailsPage from './pages/StudioDetailsPage.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLoader />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      {
        element: <PrivateRoute />,
        children: [
          { path: 'studio/:sessionId', element: <StudioPage /> },
          { path: 'create-studio', element: <CreateSTudioPage /> },
          { path: 'device-setup/:sessionId', element: <DeviceSetupPage /> },
          { path: 'studios', element: <StudiosPage /> },
          { path: '/my-studios', element: <StudioListPage /> },
          { path: '/my-studios/:sessionId', element: <StudioDetailsPage />}
          // { path: '/join/:sessionId" element={<div>Join Session Page - Implement this!</div>} />
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <RouterProvider router={router} />
        </GoogleOAuthProvider>
      </PersistGate>
    </Provider>
  )
}

export default App
