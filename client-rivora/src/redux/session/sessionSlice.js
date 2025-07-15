import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  session: null, 
  token: null,
  loading: false,
  error: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState, 
  reducers: {
    setSession: (state, action) => {
      state.session = action.payload;
      state.loading = false;
      state.error = null;
    },
    setToken: (state, action) => {
      const token = action.payload
      state.token = token;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearSession: (state) => {
      state.session = null; 
      state.loading = false;
      state.error = null;
      state.token = null; 
    },
  },
});

export const { setSession, setLoading, setError, clearSession, setToken } = sessionSlice.actions;
export default sessionSlice.reducer;