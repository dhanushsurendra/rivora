import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  session: null,      // holds session details
  loading: false,     // for async operations like create or invite
  error: null,        // error messages if any
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession: (state, action) => {
      state.session = action.payload
    },
    clearSession: (state) => {
      state.session = null
      state.error = null
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    updateGuest: (state, action) => {
      if (state.session) {
        state.session.guest = {
          ...state.session.guest,
          ...action.payload,
        }
      }
    },
    addAudienceMember: (state, action) => {
      if (state.session) {
        state.session.audience.push(action.payload)
      }
    },
    addChatMessage: (state, action) => {
      if (state.session) {
        state.session.chatMessages.push(action.payload)
      }
    },
  },
})

export const {
  setSession,
  clearSession,
  setLoading,
  setError,
  updateGuest,
  addAudienceMember,
  addChatMessage,
} = sessionSlice.actions

export default sessionSlice.reducer
