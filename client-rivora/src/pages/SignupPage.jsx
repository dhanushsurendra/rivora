import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ToastContainer, toast } from 'react-toastify'
import { useGoogleLogin } from '@react-oauth/google'
import { FcGoogle } from 'react-icons/fc'
import axiosInstance from '../api/axios'
import Spinner from '../components/Spinner/Spinner'

import {
  authStart,
  authSuccess,
  authFailure,
  saveUserToLocalStorage,
} from '../redux/auth/authSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

// Define your Zod schema for the signup form
const signupSchema = z
  .object({
    name: z.string().min(2, {
      message: 'Full Name is required and must be at least 2 characters.',
    }),
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters.' })
      .regex(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter.',
      })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter.',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
      .regex(/[^a-zA-Z0-9]/, {
        message: 'Password must contain at least one special character.',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'], // Set the error on the confirmPassword field
  })

const SignupPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(signupSchema),
  })

  const navigate = useNavigate()

  const dispatch = useDispatch()
  const loading = useSelector((state) => state.auth.loading)

  const handleSignupSubmit = async (data) => {
    dispatch(authStart())

    try {
      const res = await axiosInstance.post('/auth/signup', data, {
        withCredentials: true,
      })
      const userData = res.data.user
      dispatch(authSuccess(userData))
      saveUserToLocalStorage(userData)
      toast.success('Sign Up successful!', { theme: 'dark' })

      setTimeout(() => {
        navigate('/')
      }, 500)
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Sign Up failed'
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

        const response = await axiosInstance.post('/auth/google', {
          name: googleUser.name,
          email: googleUser.email,
          providerId: googleUser.sub,
          avatar: googleUser.picture,
        })

        const userData = response.data

        dispatch(authSuccess(userData))
        saveUserToLocalStorage(userData)
        toast.success('Google sign up successful!', { theme: 'dark' })
        setTimeout(() => {
          navigate('/')
        }, 500)
      } catch (err) {
        console.error('Google sign up error:', err)
        setError('googleError', {
          type: 'manual',
          message: 'Google sign up failed. Please try again.',
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
    // We'll modify AuthLayout slightly or replace it with a custom container here
    // for the two-column layout. For now, let's adjust the wrapper directly.
    <div className='min-h-screen bg-[#111111] flex items-center justify-center p-4'>
      <div className='bg-[#1F1F1F] rounded-lg shadow-xl w-full max-w-4xl flex overflow-hidden'>
        {' '}
        {/* Increased max-w and added flex */}
        {/* Left Section (Visuals) */}
        <div className='relative flex-1 bg-gradient-to-br from-[#8A65FD] to-[#724EE0] p-8 hidden md:flex items-center justify-center flex-col text-center'>
          <div
            className='absolute inset-0 bg-cover bg-center opacity-20'
            style={{
              backgroundImage:
                `url('/path/to/your/abstract-background-image.jpg')` ||
                `url('https://source.unsplash.com/random/800x600/?abstract,tech')`,
            }}
          >
            {/* Replace with your own image or remove if you prefer purely abstract CSS */}
          </div>

          <div className='absolute w-60 h-60 bg-[#8A65FD] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob top-10 right-10'></div>
          <div className='absolute w-60 h-60 bg-[#724EE0] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-[2000ms] bottom-10 left-10'></div>
          <div className='absolute w-60 h-60 bg-[#8A65FD] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-[4000ms] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'></div>

          <h1 className='relative z-10 text-4xl font-extrabold text-white leading-tight'>
            Join Our Vibrant Community
          </h1>
          <p className='relative z-10 mt-4 text-gray-200 text-lg'>
            Connect, create, and share your voice.
          </p>
        </div>
        {/* Right Section (Form) */}
        <div className='w-full md:w-1/2 p-8 lg:p-12'>
          {' '}
          {/* Adjusted padding for form */}
          <h2 className='text-3xl font-bold text-white text-center mb-6'>
            Sign Up
          </h2>
          {errors.apiError && (
            <p className='text-red-500 text-sm text-center mb-4'>
              {errors.apiError.message}
            </p>
          )}
          {/* {errors.googleError && <p className="text-red-500 text-sm text-center mb-4">{errors.googleError.message}</p>} */}
          <form
            onSubmit={handleSubmit(handleSignupSubmit)}
            className='space-y-4'
          >
            <div>
              <label
                htmlFor='name'
                className='block text-gray-300 text-sm font-medium mb-2'
              >
                Full Name
              </label>
              <input
                type='text'
                id='name'
                {...register('name')}
                className={`w-full p-3 rounded-md bg-[#2E2E2E] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'focus:ring-red-500 border border-red-500'
                    : 'focus:ring-[#8A65FD]'
                }`}
                placeholder='John Doe'
              />
              {errors.name && (
                <p className='text-red-400 text-xs mt-1'>
                  {errors.name.message}
                </p>
              )}
            </div>
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
            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-gray-300 text-sm font-medium mb-2'
              >
                Confirm Password
              </label>
              <input
                type='password'
                id='confirmPassword'
                {...register('confirmPassword')}
                className={`w-full p-3 rounded-md bg-[#2E2E2E] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.confirmPassword
                    ? 'focus:ring-red-500 border border-red-500'
                    : 'focus:ring-[#8A65FD]'
                }`}
                placeholder='••••••••'
              />
              {errors.confirmPassword && (
                <p className='text-red-400 text-xs mt-1'>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <button
              type='submit'
              className='w-full bg-[#8A65FD] hover:bg-[#724EE0] text-white font-semibold py-3 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#8A65FD] flex items-center justify-center cursor-pointer'
              disabled={loading}
            >
              {loading ? <Spinner /> : 'Sign Up'}
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
            onClick={googleLogin} // Uncomment if googleLogin is used
            className='w-full flex items-center justify-center space-x-2 bg-white text-gray-800 font-semibold py-3 rounded-md transition-colors duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer'
          >
            <FcGoogle className='w-6 h-6' />
            <span>Sign Up with Google</span>
          </button>
          <p className='text-center text-gray-400 text-sm mt-6'>
            Already have an account?{' '}
            <a href='/login' className='text-[#8A65FD] hover:underline'>
              Login
            </a>
          </p>
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}

export default SignupPage
