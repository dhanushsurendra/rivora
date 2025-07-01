import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  studioJoinData: null,
}

const studioSlice = createSlice({
  name: 'studio',
  initialState,
  reducers: {
    setStudioJoinData: (state, action) => {
      state.studioJoinData = action.payload
    },
    clearStudioJoinData: (state) => {
      state.studioJoinData = null
    },
  },
})

export const { setStudioJoinData, clearStudioJoinData } = studioSlice.actions
export default studioSlice.reducer