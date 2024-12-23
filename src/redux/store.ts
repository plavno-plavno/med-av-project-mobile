import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../api/auth/authApi';
import { setupListeners } from '@reduxjs/toolkit/query';
import calendarSlice from './slices/calendarSlice/calendarSlice';
import { userApi } from 'src/api/userApi/userApi';
import { calendarApi } from 'src/api/calendarApi/calendarApi';
import { mediaApi } from 'src/api/media/mediaApi';


const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [calendarApi.reducerPath]: calendarApi.reducer,
    [mediaApi.reducerPath]: mediaApi.reducer,
    calendar: calendarSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      authApi.middleware,
      userApi.middleware,
      calendarApi.middleware,
      mediaApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
