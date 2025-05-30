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
import StudiosPage from './pages/StudiosPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import DeviceSetupPage from './pages/DeviceSetupPage.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import RootLoader from './components/RootLoader.jsx'

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
          { path: 'studio', element: <StudioPage /> },
          { path: 'create-studio', element: <CreateSTudioPage /> },
          { path: 'device-setup', element: <DeviceSetupPage /> },
          { path: 'studios', element: <StudiosPage /> },
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
