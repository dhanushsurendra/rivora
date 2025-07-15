import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.loading = true
      state.error = null
    },
    authSuccess: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.loading = false
    },
    authFailure: (state, action) => {
      state.error = action.payload
      state.loading = false
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
    },
  },
})

export const saveUserToLocalStorage = (user) => {
  localStorage.clear()
}

export const removeUserFromLocalStorage = () => {
  localStorage.clear()
}

export const { authStart, authSuccess, authFailure, logout } = authSlice.actions
export default authSlice.reducer
