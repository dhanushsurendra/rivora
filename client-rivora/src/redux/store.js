// src/store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import authReducer from './auth/authSlice'
import sessionReducer from './session/sessionSlice'
import studioReducer from './studio/studioSlice'

import storage from 'redux-persist/lib/storage'
import { persistReducer, persistStore } from 'redux-persist'
import logger from 'redux-logger'

const persistConfig = {
  key: 'root',
  storage,
}

// Combine your reducers
const appReducer = combineReducers({
  auth: authReducer,
  session: sessionReducer,
  studio: studioReducer,
})

// Root reducer with RESET_STORE logic
const rootReducer = (state, action) => {
  if (action.type === 'RESET_STORE') {
    storage.removeItem('persist:root') // Clear localStorage persisted state
    return appReducer(undefined, action) // Reset Redux state
  }
  return appReducer(state, action)
}

// Persist the rootReducer
const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(logger),
})

export const persistor = persistStore(store)
export default store
