import { createSlice } from '@reduxjs/toolkit';

// --- VERIFY THIS PART CAREFULLY ---
const initialState = {
  session: null, // <--- This MUST be here, initialized to null or an empty object
  loading: false,
  error: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState, // Make sure 'initialState' is passed correctly here
  reducers: {
    setSession: (state, action) => {
      state.session = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    // --- Your clearSession reducer ---
    clearSession: (state) => {
      // Add a console.log here to inspect the 'state' object when the error occurs
      console.log("State received by clearSession:", state);
      state.session = null; // The error points to this line
      state.loading = false;
      state.error = null;
    },
  },
});

// Ensure clearSession is exported here
export const { setSession, setLoading, setError, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;