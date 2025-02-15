import { configureStore } from "@reduxjs/toolkit"
import { authApi } from "../api/auth/authApi"
import { setupListeners } from "@reduxjs/toolkit/query"
import calendarSlice from "./slices/calendarSlice/calendarSlice"
import { userApi } from "src/api/userApi/userApi"
import { calendarApi } from "src/api/calendarApi/calendarApi"
import { mediaApi } from "src/api/mediaApi/mediaApi"
import { helpCenterApi } from "src/api/helpCenterApi/helpCenterApi"
import subtitlesSlice from "./slices/calendarSlice/subtitlesSlice"

const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [calendarApi.reducerPath]: calendarApi.reducer,
    [helpCenterApi.reducerPath]: helpCenterApi.reducer,
    [mediaApi.reducerPath]: mediaApi.reducer,
    calendar: calendarSlice,
    subtitles: subtitlesSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      authApi.middleware,
      userApi.middleware,
      calendarApi.middleware,
      helpCenterApi.middleware,
      mediaApi.middleware
    ),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
