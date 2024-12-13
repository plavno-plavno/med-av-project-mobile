import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../api/auth/authApi';
import { setupListeners } from '@reduxjs/toolkit/query';
import calendarSlice from './slices/calendarSlice/calendarSlice';
import { userApi } from 'src/api/userApi/userApi';
import { calendarApi } from 'src/api/calendarApi/calendarApi';


const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [calendarApi.reducerPath]: calendarApi.reducer,

    calendar: calendarSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      authApi.middleware,
      userApi.middleware,
      calendarApi.middleware,
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
