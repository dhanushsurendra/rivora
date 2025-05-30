import { configureStore } from '@reduxjs/toolkit'
import authReducer from './auth/authSlice'
import sessionReducer from './session/sessionSlice'
import storage from 'redux-persist/lib/storage'
import { persistReducer, persistStore } from 'redux-persist'
import { combineReducers } from 'redux'
import logger from 'redux-logger'

const persistConfig = {
  key: 'root',
  storage,
}

const rootReducer = combineReducers({
  session: sessionReducer,
  auth: authReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // needed for redux-persist
    }).concat(logger),
})

export const persistor = persistStore(store)
export default store
