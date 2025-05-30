import { useDispatch, useSelector } from 'react-redux'
import {
  authStart,
  authSuccess,
  authFailure,
  saveUserToLocalStorage,
} from '../redux/auth/authSlice'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ToastContainer, toast } from 'react-toastify'
import { useGoogleLogin } from '@react-oauth/google'
import { FcGoogle } from 'react-icons/fc'
import axiosInstance from '../api/axios'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner/Spinner'

// Define your Zod schema for the login form
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
})

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const navigate = useNavigate()

  const dispatch = useDispatch()
  const loading = useSelector((state) => state.auth.loading)
  const handleLoginSubmit = async (data) => {
    console.log('Logging in with:', data)
    dispatch(authStart())

    try {
      const res = await axiosInstance.post('/auth/login', data, {
        withCredentials: true,
      })
      const userData = res.data.user
      dispatch(authSuccess(userData))
      saveUserToLocalStorage(userData)
      toast.success('Login successful!', { theme: 'dark' })

      setTimeout(() => {
        navigate('/')
      }, 500)
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed'
      dispatch(authFailure(errorMessage))
      setError('apiError', {
        type: 'manual',
        message: errorMessage,
      })
      console.error(error)
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        )

        const googleUser = await res.json()
        console.log('Google user info:', googleUser)

        const response = await axiosInstance.post('/auth/google', {
          name: googleUser.name,
          email: googleUser.email,
          providerId: googleUser.sub,
          avatar: googleUser.picture,
        })

        const userData = response.data

        dispatch(authSuccess(userData))
        saveUserToLocalStorage(userData)
        toast.success('Google login successful!', { theme: 'dark' })
        setTimeout(() => {
          navigate('/')
        }, 500)
      } catch (err) {
        console.error('Google login error:', err)
        setError('googleError', {
          type: 'manual',
          message: 'Google login failed. Please try again.',
        })
      }
    },
    onError: (errorResponse) => {
      console.error('Google login failed:', errorResponse)
      const errorMessage = error.response?.data?.message || 'Login failed'
      dispatch(authFailure(errorMessage))
      setError('apiError', {
        type: 'manual',
        message: errorMessage,
      })
      console.error(error)
    },
  })

  return (
    // We'll directly create the two-column layout here
    <div className='min-h-screen bg-[#111111] flex items-center justify-center p-4'>
      <div className='bg-[#1F1F1F] rounded-lg shadow-xl w-full max-w-4xl flex overflow-hidden'>
        {/* Left Section (Visuals) - Replicated from SignupPage */}
        <div className='relative flex-1 bg-gradient-to-br from-[#8A65FD] to-[#724EE0] p-8 hidden md:flex items-center justify-center flex-col text-center'>
          <div
            className='absolute inset-0 bg-cover bg-center opacity-20'
            style={{
              backgroundImage:
                `url('/path/to/your/abstract-background-image.jpg')` ||
                `url('https://source.unsplash.com/random/800x600/?abstract,sound')`,
            }}
          >
            {/* Replace with your own image or remove if you prefer purely abstract CSS */}
          </div>

          {/* Abstract glowing shapes */}
          <div className='absolute w-60 h-60 bg-[#8A65FD] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob top-10 right-10'></div>
          <div className='absolute w-60 h-60 bg-[#724EE0] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-[2000ms] bottom-10 left-10'></div>
          <div className='absolute w-60 h-60 bg-[#8A65FD] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-[4000ms] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'></div>

          <h1 className='relative z-10 text-4xl font-extrabold text-white leading-tight'>
            Welcome Back!
          </h1>
          <p className='relative z-10 mt-4 text-gray-200 text-lg'>
            Pick up where you left off.
          </p>
        </div>

        {/* Right Section (Form) */}
        <div className='w-full md:w-1/2 p-8 lg:p-12'>
          <h2 className='text-3xl font-bold text-white text-center mb-6'>
            Log In
          </h2>
          {errors.apiError && (
            <p className='text-red-500 text-sm text-center mb-4'>
              {errors.apiError.message}
            </p>
          )}
          {/* {errors.googleError && <p className="text-red-500 text-sm text-center mb-4">{errors.googleError.message}</p>} */}
          {errors.credentials && (
            <p className='text-red-500 text-sm text-center mb-4'>
              {errors.credentials.message}
            </p>
          )}

          <form
            onSubmit={handleSubmit(handleLoginSubmit)}
            className='space-y-4'
          >
            <div>
              <label
                htmlFor='email'
                className='block text-gray-300 text-sm font-medium mb-2'
              >
                Email
              </label>
              <input
                type='email'
                id='email'
                {...register('email')}
                className={`w-full p-3 rounded-md bg-[#2E2E2E] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'focus:ring-red-500 border border-red-500'
                    : 'focus:ring-[#8A65FD]'
                }`}
                placeholder='your@example.com'
              />
              {errors.email && (
                <p className='text-red-400 text-xs mt-1'>
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor='password'
                className='block text-gray-300 text-sm font-medium mb-2'
              >
                Password
              </label>
              <input
                type='password'
                id='password'
                {...register('password')}
                className={`w-full p-3 rounded-md bg-[#2E2E2E] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.password
                    ? 'focus:ring-red-500 border border-red-500'
                    : 'focus:ring-[#8A65FD]'
                }`}
                placeholder='••••••••'
              />
              {errors.password && (
                <p className='text-red-400 text-xs mt-1'>
                  {errors.password.message}
                </p>
              )}
            </div>
            <button
              type='submit'
              className='w-full bg-[#8A65FD] hover:bg-[#724EE0] text-white font-semibold py-3 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#8A65FD] flex items-center justify-center cursor-pointer'
              disabled={loading}
            >
              {loading ? (
                <Spinner />
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className='relative flex items-center justify-center my-6'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t border-gray-700'></span>
            </div>
            <div className='relative px-3 text-gray-400 bg-[#1F1F1F] text-sm'>
              Or
            </div>
          </div>

          <button
            onClick={googleLogin}
            className='w-full flex items-center justify-center space-x-2 bg-white text-gray-800 font-semibold py-3 rounded-md transition-colors duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer'
          >
            <FcGoogle className='w-6 h-6' />
            <span>Login with Google</span>
          </button>

          <p className='text-center text-gray-400 text-sm mt-6'>
            Don't have an account?{' '}
            <a href='/signup' className='text-[#8A65FD] hover:underline'>
              Sign Up
            </a>
          </p>
        </div>
        <ToastContainer />
      </div>
    </div>
  )
}

export default LoginPage
