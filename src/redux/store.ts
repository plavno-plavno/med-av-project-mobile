import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../api/auth/authApi';
import { setupListeners } from '@reduxjs/toolkit/query';
import calendarSlice from './slices/calendarSlice/calendarSlice';

const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    calendar: calendarSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(authApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
